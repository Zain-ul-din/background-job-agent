import {
  Experimental_DecisionModelV4CallOptions,
  Experimental_DecisionModelV4Result,
  type Experimental_DecisionModelV4 as DecisionModelV4,
} from "@ai-sdk/provider";

class ClefAIModel implements DecisionModelV4 {
  modelId: string;
  readonly specificationVersion: "v4" = "v4";
  readonly baseUrl = "https://api.cloudflare.com/client/v4/accounts";
  provider: string = "cloudflare";

  constructor(modelId: string) {
    this.modelId = modelId;
  }

  async doDecide(
    options: Experimental_DecisionModelV4CallOptions,
  ): Promise<Experimental_DecisionModelV4Result> {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    const { state, questions } = options;

    const res = await fetch(
      `${this.baseUrl}/${accountId}/ai/run/${this.modelId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state,
          questions,
        }),
      },
    );

    const json = await res.json();

    return {
      answers: json.result.answers,
      warnings: json.errors,
      usage: json.result.usage,
    };
  }

  readonly supportedQuestionTypes = [
    "choice",
    "score",
    "boolean",
    "box",
  ] as const;
}

export const clefAIModel = new ClefAIModel("@cf/cloudflare/clef");
