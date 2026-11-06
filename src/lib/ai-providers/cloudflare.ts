import {
  APICallError,
  type Experimental_DecisionModelV4 as DecisionModelV4,
  type Experimental_DecisionModelV4Answer,
  type Experimental_DecisionModelV4CallOptions,
  type Experimental_DecisionModelV4Question,
  type Experimental_DecisionModelV4Result,
  type LanguageModelV4FilePart,
} from "@ai-sdk/provider";

const BASE_URL = "https://api.cloudflare.com/client/v4/accounts";
const IMAGE_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"];

type CloudflareEnvelope = {
  success?: boolean;
  errors?: Array<{ code?: number; message?: string } | string>;
  messages?: Array<{ code?: number; message?: string } | string>;
  result?: {
    answers?: Record<string, Experimental_DecisionModelV4Answer>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
};

function credentials() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "Cloudflare credentials are missing: set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to classify job postings.",
    );
  }

  return { accountId, apiToken };
}

function imageDataUri(part: LanguageModelV4FilePart) {
  if (part.data.type !== "data" || !IMAGE_MEDIA_TYPES.includes(part.mediaType)) {
    throw new Error(
      `Clef cannot read "${part.mediaType}" state attachments; use png, jpeg or webp images.`,
    );
  }

  const { data } = part.data;
  if (typeof data === "string" && data.startsWith("data:")) return data;

  const base64 = typeof data === "string" ? data : Buffer.from(data).toString("base64");
  return `data:${part.mediaType};base64,${base64}`;
}

function buildState(state: Experimental_DecisionModelV4CallOptions["state"]) {
  const text: string[] = [];
  const images: string[] = [];

  for (const part of state) {
    if (part.type === "text") {
      text.push(part.text);
    } else if (part.type === "json") {
      text.push(JSON.stringify(part.value));
    } else {
      images.push(imageDataUri(part));
    }
  }

  return { state: text.join("\n"), images };
}

function normalizeDistribution(
  answer: Experimental_DecisionModelV4Answer,
  question?: Experimental_DecisionModelV4Question,
) {
  if (!question) return answer;
  if (answer.type !== "choice" && answer.type !== "score") return answer;
  if (!answer.probabilities) return answer;
  if (question.type !== "choice" && question.type !== "score") return answer;

  const probabilities = answer.probabilities;
  const keys =
    question.type === "choice"
      ? Object.keys(question.criteria)
      : question.criteria.map((_, index) => String(index));

  const values = keys.map((key) => {
    const value = Number(probabilities[key]);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const total = values.reduce((sum, value) => sum + value, 0);

  if (total <= 0) return answer;

  return {
    ...answer,
    probabilities: Object.fromEntries(
      keys.map((key, index) => [key, values[index] / total]),
    ),
  };
}

function parseBody(
  body: string,
  url: string,
  statusCode: number,
  requestBodyValues: unknown,
): CloudflareEnvelope {
  try {
    const parsed = JSON.parse(body);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("response body is not a JSON object");
    }
    return parsed;
  } catch {
    throw new APICallError({
      message: `Clef returned an unreadable response body with status ${statusCode}`,
      url,
      statusCode,
      responseBody: body,
      requestBodyValues,
    });
  }
}

function failureDetail(envelope: CloudflareEnvelope, body: string) {
  const errors = (envelope.errors ?? [])
    .map((error) =>
      typeof error === "string"
        ? error
        : `${error.code ? `${error.code}: ` : ""}${error.message ?? ""}`,
    )
    .filter(Boolean)
    .join("; ");

  return errors || body || "no error details returned";
}

function toWarnings(entries: CloudflareEnvelope["messages"] = []) {
  return entries.map((entry) => ({
    type: "other" as const,
    message:
      typeof entry === "string"
        ? entry
        : `${entry.code ? `${entry.code}: ` : ""}${entry.message ?? ""}`,
  }));
}

class ClefAIModel implements DecisionModelV4 {
  modelId: string;
  readonly specificationVersion = "v4" as const;
  readonly baseUrl = BASE_URL;
  readonly provider = "cloudflare";
  readonly supportedQuestionTypes = ["choice", "score"] as const;

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  async doDecide(
    options: Experimental_DecisionModelV4CallOptions,
  ): Promise<Experimental_DecisionModelV4Result> {
    const { accountId, apiToken } = credentials();
    const url = `${this.baseUrl}/${accountId}/ai/run/${this.modelId}`;
    const { state, images } = buildState(options.state);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    };
    for (const [key, value] of Object.entries(options.headers ?? {})) {
      if (typeof value === "string") headers[key] = value;
    }

    const requestBody = {
      model: this.modelId.split("/").pop(),
      state,
      questions: options.questions,
      ...(images.length > 0 ? { images } : {}),
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: options.abortSignal,
    });

    const body = await response.text();
    const envelope = parseBody(body, url, response.status, requestBody);

    if (!response.ok || envelope.success === false) {
      throw new APICallError({
        message: `Clef request failed with status ${response.status}: ${failureDetail(envelope, body)}`,
        url,
        statusCode: response.status,
        responseBody: body,
        requestBodyValues: requestBody,
        data: envelope.errors,
      });
    }

    if (!envelope.result?.answers) {
      throw new APICallError({
        message: `Clef response contained no answers: ${body}`,
        url,
        statusCode: response.status,
        responseBody: body,
        requestBodyValues: requestBody,
      });
    }

    const answers = Object.fromEntries(
      Object.entries(envelope.result.answers).map(([id, answer]) => [
        id,
        normalizeDistribution(answer, options.questions[id]),
      ]),
    );

    return {
      answers,
      usage: {
        inputTokens: envelope.result.usage?.input_tokens,
        outputTokens: envelope.result.usage?.output_tokens,
      },
      warnings: toWarnings(envelope.messages),
    };
  }
}

export const clefAIModel = new ClefAIModel("@cf/cloudflare/clef");
