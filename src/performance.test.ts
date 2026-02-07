import { describe, test } from "vitest";

describe("profile clamp", () => {
  const trials = 1e6;

  test("with `Math.max` and `Math.min`", () => {
    const start = performance.now();
    for (let i = 0; i < trials; i++) {
      const r = Math.random();
      Math.max(0, Math.min(1, r));
    }
    const end = performance.now();
    console.log(end - start);
  });

  test("with `>=` and `<=`", () => {
    const start = performance.now();
    for (let i = 0; i < trials; i++) {
      const r = Math.random();
      r >= 1 ? 1 : r <= 0 ? 0 : r;
    }
    const end = performance.now();
    console.log(end - start);
  });
});
