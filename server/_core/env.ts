export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // LLM provider selection: "openai" (OpenAI-compatible endpoint above),
  // "bedrock" (Claude on Bedrock), or "converse" (any Bedrock model)
  llmProvider: process.env.LLM_PROVIDER ?? "openai",
  // Model sent to the OpenAI-compatible endpoint (LLM_PROVIDER=openai)
  llmModel: process.env.LLM_MODEL ?? "gemini-2.5-flash",
  awsRegion: process.env.AWS_REGION ?? "us-west-2",
  bedrockApiKey: process.env.AWS_BEARER_TOKEN_BEDROCK ?? "",
  bedrockModelId: process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-haiku-4-5",
};
