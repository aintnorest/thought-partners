import { describe, expect, it } from "vitest";
import { readFlags } from "./flags";

describe("readFlags", () => {
  it("recognizes enabled query flags", () => {
    expect(readFlags("?fixture=1&noimages=true")).toEqual({
      fixture: true,
      noimages: true,
      novoice: false,
    });
  });

  it("defaults every flag to false", () => {
    expect(readFlags("")).toEqual({
      fixture: false,
      noimages: false,
      novoice: false,
    });
  });
});
