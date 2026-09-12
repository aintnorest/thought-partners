import {
  BuiltInAgent,
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { MODELS } from "@/lib/models";
import { JACQUES_AGENT_PROMPT } from "@/lib/prompts/agent";

process.env.OPENAI_BASE_URL ??= "https://openrouter.ai/api/v1";

const agent = new BuiltInAgent({
  model: `openai/${MODELS.agent}`,
  apiKey: process.env.OPENROUTER_API_KEY,
  prompt: JACQUES_AGENT_PROMPT,
  maxSteps: 4,
});

const agents = { default: agent };
const intelligenceApiKey = process.env.CPK_INTELLIGENCE_API_KEY;
const runtime = intelligenceApiKey
  ? new CopilotRuntime({
      agents,
      intelligence: new CopilotKitIntelligence({ apiKey: intelligenceApiKey }),
      identifyUser: () => ({ id: "demo", name: "Demo" }),
    })
  : new CopilotRuntime({ agents });

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const dynamic = "force-dynamic";
export const GET = handler;
export const POST = handler;
