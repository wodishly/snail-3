import { describe, test } from "vitest";
import type { Flight } from "./list";
import type { Assert } from "./type";

const trials = 1e7;

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

const benchmarkArray = <N extends number>(
  f: (rs: Flight<number, N>, r: number) => any,
  length?: N,
) => {
  return () => {
    const l = length ?? Math.floor(100 * Math.random());
    const rs = Array(length).map(() => Math.random()) as Assert<
      Flight<number, N>
    >;
    const r = rs[l * Math.random()]!;

    const start = performance.now();
    for (let i = 0; i < trials; i++) {
      f(rs, r);
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

describe("timing listthinghood with", () => {
  test(
    "loop",
    benchmarkArray((rs, r) => {
      for (let i = 0; i < rs.length; i++) {
        if (r === rs[i]) {
          return true;
        }
      }
      return false;
    }),
  );
  test(
    "includes",
    benchmarkArray((rs, r) => rs.includes(r)),
  );
});
describe("timing flightthinghood with", () => {
  const length = 2;
  test(
    "primitives",
    benchmarkArray(([a, b], r) => r === a || r === b, length),
  );
  test(
    "loop",
    benchmarkArray((rs, r) => {
      for (let i = 0; i < rs.length; i++) {
        if (r === rs[i]) {
          return true;
        }
      }
      return false;
    }, length),
  );
  test(
    "includes",
    benchmarkArray((rs, r) => rs.includes(r), length),
  );
});
