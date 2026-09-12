import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Offline from "./page";

describe("Offline page", () => {
  it("tells the user they are offline", () => {
    const { container } = render(<Offline />);
    expect(container.textContent?.toLowerCase()).toContain("offline");
  });
});
