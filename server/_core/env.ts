export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // LLM provider selection: "openai" (OpenAI-compatible endpoint above) or "bedrock"
  llmProvider: process.env.LLM_PROVIDER ?? "openai",
  awsRegion: process.env.AWS_REGION ?? "us-west-2",
  bedrockApiKey: process.env.AWS_BEARER_TOKEN_BEDROCK ?? "",
  bedrockModelId: process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-haiku-4-5",
};
