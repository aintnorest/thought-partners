import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ImportForm } from "./import-form";

describe("ImportForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("disables every action and shows the working state while pending", () => {
    const { container } = render(<ImportForm onSubmit={vi.fn()} onUseSample={vi.fn()} pending />);

    const submitButton = screen.getByRole("button", { name: "Jacques is planning…" });
    const sampleButton = screen.getByRole("button", { name: "Load sample recipe (Carbonara)" });
    const urlInput = screen.getByPlaceholderText("https://...");
    const textarea = container.querySelector("textarea");

    expect(submitButton).toBeDisabled();
    expect(sampleButton).toBeDisabled();
    expect(urlInput).toBeDisabled();
    expect(textarea).toBeDisabled();
    expect(submitButton).toHaveAttribute("aria-disabled", "true");
    expect(sampleButton).toHaveAttribute("aria-disabled", "true");
    expect(urlInput).toHaveAttribute("aria-disabled", "true");
    expect(textarea).toHaveAttribute("aria-disabled", "true");
    expect(container.querySelector(".pulse-ember")).toBeInTheDocument();
    expect(submitButton.closest("form")).toHaveAttribute("aria-busy", "true");
  });

  it("shows URL-specific progress copy and advances it after eight seconds", () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<ImportForm onSubmit={onSubmit} onUseSample={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://example.com/recipe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start cooking" }));
    rerender(<ImportForm onSubmit={onSubmit} onUseSample={vi.fn()} pending />);

    expect(screen.getByRole("button", { name: "Jacques is reading the recipe…" })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Fetching the page and reading the steps.",
    );

    act(() => {
      vi.advanceTimersByTime(9000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Working out the order and the timers.");
  });

  it("submits a URL once when not pending", () => {
    const onSubmit = vi.fn();
    render(<ImportForm onSubmit={onSubmit} onUseSample={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("https://..."), {
      target: { value: "https://example.com/recipe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start cooking" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://example.com/recipe",
      text: undefined,
    });
  });
});
