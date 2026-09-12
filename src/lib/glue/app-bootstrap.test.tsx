import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "@/lib/store";
import { AppBootstrap } from "./app-bootstrap";

vi.mock("@/lib/glue/heartbeat-scheduler", () => ({
  HeartbeatScheduler: () => null,
}));

beforeEach(() => {
  useStore.setState({ plan: undefined, watch: { active: false, status: "idle" } });
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("AppBootstrap", () => {
  it("loads the fixture plan and renders children when fixture mode is enabled", async () => {
    window.history.replaceState({}, "", "/?fixture=1");

    render(<AppBootstrap>Ready</AppBootstrap>);

    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(useStore.getState().plan?.id).toBe("carbonara");
  });

  it("leaves the plan unset and renders children without fixture mode", async () => {
    window.history.replaceState({}, "", "/");

    render(<AppBootstrap>Ready</AppBootstrap>);

    expect(await screen.findByText("Ready")).toBeInTheDocument();
    expect(useStore.getState().plan).toBeUndefined();
  });
});
