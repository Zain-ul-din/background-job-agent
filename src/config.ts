import { models } from "./lib/models";

type Config = {
  model: keyof typeof models;
};

export const config: Config = {
  model: "mistral",
};
