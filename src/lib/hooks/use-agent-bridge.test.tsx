import { useAgentContext, useFrontendTool } from "@copilotkit/react-core/v2";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import carbonaraFixture from "@/fixtures/plan.carbonara.json";
import { useStore } from "@/lib/store";
import type { RecipePlan } from "@/lib/types";
import { useAgentBridge } from "./use-agent-bridge";

vi.mock("@copilotkit/react-core/v2", () => ({
  useAgentContext: vi.fn(),
  useFrontendTool: vi.fn(),
}));

const plan = carbonaraFixture as RecipePlan;

function AgentBridgeHarness() {
  useAgentBridge();
  return null;
}

describe("useAgentBridge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({
      plan: undefined,
      stepIndex: 0,
      cards: [],
      activeTimer: undefined,
      generation: 0,
    });
    useStore.getState().setPlan(plan);
  });

  afterEach(() => {
    cleanup();
  });

  it("registers its contexts and tools, and only highlights known steps", async () => {
    render(<AgentBridgeHarness />);

    expect(useAgentContext).toHaveBeenCalledTimes(2);
    expect(useFrontendTool).toHaveBeenCalledTimes(3);

    const registrations = vi.mocked(useFrontendTool).mock.calls.map(([tool]) => tool);
    const highlight = registrations.find((tool) => tool.name === "highlight_step");
    expect(highlight?.handler).toBeTypeOf("function");

    const target = plan.steps[2];
    const success = await highlight?.handler?.({ stepId: target.id }, {} as never);
    expect(success).toContain(target.title);
    expect(useStore.getState().stepIndex).toBe(2);

    const beforeUnknown = useStore.getState().stepIndex;
    const failure = await highlight?.handler?.({ stepId: "not-a-step" }, {} as never);
    expect(failure).toMatch(/no step/i);
    expect(useStore.getState().stepIndex).toBe(beforeUnknown);
  });

  it("puts heartbeat coaching on the current step rather than the registration-time step", async () => {
    render(<AgentBridgeHarness />);

    const registration = vi
      .mocked(useFrontendTool)
      .mock.calls.map(([tool]) => tool)
      .find((tool) => tool.name === "show_heartbeat");
    expect(registration?.handler).toBeTypeOf("function");

    act(() => {
      useStore.getState().goto(1);
    });
    await act(async () => {
      await registration?.handler?.({ line: "Keep whisking." }, {} as never);
    });

    expect(useStore.getState().cards).toContainEqual({
      kind: "heartbeat",
      stepId: plan.steps[1].id,
      line: "Keep whisking.",
    });
  });

  it("registers tools that refuse safely when no plan is loaded", async () => {
    useStore.setState({ plan: undefined });
    render(<AgentBridgeHarness />);

    const registrations = vi.mocked(useFrontendTool).mock.calls.map(([tool]) => tool);
    const highlight = registrations.find((tool) => tool.name === "highlight_step");
    const timer = registrations.find((tool) => tool.name === "start_timer");
    const heartbeat = registrations.find((tool) => tool.name === "show_heartbeat");

    const results = await Promise.all([
      highlight?.handler?.({ stepId: "missing" }, {} as never),
      timer?.handler?.({}, {} as never),
      heartbeat?.handler?.({ line: "Keep going." }, {} as never),
    ]);

    expect(useFrontendTool).toHaveBeenCalledTimes(3);
    expect(results).toEqual([
      "No step with id missing.",
      "There is no current step to time.",
      "There is no current step for coaching.",
    ]);
  });
});
