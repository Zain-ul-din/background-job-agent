import { mistral as mistralModel } from "@ai-sdk/mistral";
import { openaiSubscription } from "./ai-providers/openai-subscription";
import { clefAIModel } from "./ai-providers/cloudflare";

export const models = {
  openaiSubscription: openaiSubscription.responses("gpt-6-sol"),
  mistral: mistralModel("mistral-small-2603"),
};

export const decisionModels = {
  clef: clefAIModel,
};
