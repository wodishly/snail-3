import { describe, test } from "vitest";

const trials = 1e5;

const benchmark = (f: (r: number) => any) => {
  return () => {
    const x = Math.random();
    const start = performance.now();
    for (let i = 0; i < trials; i++) {
      f(x);
    }
    const end = performance.now();
    console.log(end - start);
  };
};

describe("profile clamp", () => {
  test(
    "with `Math.max` and `Math.min`",
    benchmark((r) => Math.max(0, Math.min(1, r))),
  );
  test(
    "with `>=` and `<=`",
    benchmark((r) => (r >= 1 ? 1 : r <= 0 ? 0 : r)),
  );
});

describe("square clamp", () => {
  test(
    "with *",
    benchmark((r) => r * r),
  );
  test(
    "with **",
    benchmark((r) => r ** 2),
  );
  test(
    "with Math.pow",
    benchmark((r) => Math.pow(r, 2)),
  );
});
