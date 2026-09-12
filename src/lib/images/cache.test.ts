import { beforeEach, describe, expect, it, vi } from "vitest";
import { _resetCacheForTests, getOrCreate } from "./cache";

describe("image cache", () => {
  beforeEach(() => {
    _resetCacheForTests();
  });

  it("reuses a resolved image for the same key", async () => {
    const produce = vi.fn(async () => "data:x");

    await expect(getOrCreate("same", produce)).resolves.toBe("data:x");
    await expect(getOrCreate("same", produce)).resolves.toBe("data:x");

    expect(produce).toHaveBeenCalledTimes(1);
  });

  it("shares an in-flight image production for the same key", async () => {
    let resolve!: (value: string) => void;
    const deferred = new Promise<string>((done) => {
      resolve = done;
    });
    const produce = vi.fn(() => deferred);

    const first = getOrCreate("same", produce);
    const second = getOrCreate("same", produce);
    expect(produce).toHaveBeenCalledTimes(0);

    await Promise.resolve();
    expect(produce).toHaveBeenCalledTimes(1);
    resolve("data:x");

    await expect(Promise.all([first, second])).resolves.toEqual(["data:x", "data:x"]);
    expect(produce).toHaveBeenCalledTimes(1);
  });

  it("does not cache an undefined result", async () => {
    const produce = vi.fn(async () => undefined);

    await expect(getOrCreate("retry", produce)).resolves.toBeUndefined();
    await expect(getOrCreate("retry", produce)).resolves.toBeUndefined();

    expect(produce).toHaveBeenCalledTimes(2);
  });
});
