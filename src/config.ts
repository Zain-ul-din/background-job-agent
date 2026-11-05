import { decisionModels, models } from "./lib/models";

type Config = {
  model: keyof typeof models;
  decisionModel: keyof typeof decisionModels;
};

export const config: Config = {
  model: "mistral",
  decisionModel: "clef",
};
