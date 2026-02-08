import { expectTypeOf } from "vitest";
import type { Flight } from "./list";
import type { Assert } from "./type";

/**
 * @param N <= 998
 */
export type After<N extends number> = [
  N,
  ...Flight<any, N>,
]["length"] extends infer T extends number
  ? T
  : never;
export const after = <N extends number>(n: N) => (n + 1) as Assert<After<N>>;

expectTypeOf<After<0>>().toEqualTypeOf(1 as const);
expectTypeOf<After<1>>().toEqualTypeOf(2 as const);
expectTypeOf<After<2>>().toEqualTypeOf(3 as const);

/**
 * @param N <= 998
 */
export type Before<N extends number> =
  Flight<any, N> extends [any, ...infer L] ? L["length"] : never;
export const before = <N extends number>(n: N) => (n - 1) as Assert<Before<N>>;

expectTypeOf(0 as const).toEqualTypeOf<Before<1>>();
expectTypeOf(1 as const).toEqualTypeOf<Before<2>>();
expectTypeOf(2 as const).toEqualTypeOf<Before<3>>();

export type Plus<N extends number, M extends number> = [
  ...Flight<any, N>,
  ...Flight<any, M>,
]["length"];
export const plus = <N extends number, M extends number>(n: N, m: M) =>
  (n + m) as Assert<Plus<N, M>>;

expectTypeOf(0 as const).toEqualTypeOf<Plus<0, 0>>();
expectTypeOf(1 as const).toEqualTypeOf<Plus<1, 0>>();
expectTypeOf(1 as const).toEqualTypeOf<Plus<0, 1>>();
expectTypeOf(2 as const).toEqualTypeOf<Plus<1, 1>>();
expectTypeOf(plus(3, 4)).toEqualTypeOf<7>();

export type Minus<N extends number, M extends number> =
  Flight<any, N> extends [...Flight<any, M>, ...infer R] ? R["length"] : never;
export const minus = <N extends number, M extends number>(n: N, m: M) =>
  (n - m) as Assert<Minus<N, M>>;

expectTypeOf<Minus<0, 0>>().toEqualTypeOf(0 as const);
expectTypeOf<Minus<1, 0>>().toEqualTypeOf(1 as const);
expectTypeOf<Minus<4, 2>>().toEqualTypeOf(2 as const);

export type Divide<N extends number, M extends number> = M extends 0
  ? never
  : Minus<N, M> extends never
    ? 0
    : After<Divide<Minus<N, M>, M>>;

export type Half<N extends number> =
  Oddly<N> extends never ? Divide<N, 2> : ParseInt<`${Divide<N, 2>}.5`>;
export const halve = <N extends number>(n: N) => (n / 2) as Assert<Half<N>>;

expectTypeOf(0 as const).toEqualTypeOf<Divide<0, 1>>();
expectTypeOf(1 as const).toEqualTypeOf<Divide<1, 1>>();
expectTypeOf(1 as const).toEqualTypeOf<Divide<3, 2>>();

export type Modulo<N extends number, M extends number> =
  Minus<N, M> extends never ? N : Modulo<Minus<N, M>, M>;

expectTypeOf<Modulo<0, 1>>().toEqualTypeOf(0 as const);

expectTypeOf<Modulo<1, 1>>().toEqualTypeOf(0 as const);
expectTypeOf<Modulo<1, 2>>().toEqualTypeOf(1 as const);
expectTypeOf<Modulo<2, 1>>().toEqualTypeOf(0 as const);
expectTypeOf<Modulo<2, 2>>().toEqualTypeOf(0 as const);

expectTypeOf<Modulo<3, 1>>().toEqualTypeOf(0 as const);

expectTypeOf<Modulo<4, 2>>().toEqualTypeOf(0 as const);

expectTypeOf<Modulo<5, 3>>().toEqualTypeOf(2 as const);

expectTypeOf<Modulo<6, 3>>().toEqualTypeOf(0 as const);
expectTypeOf<Modulo<6, 4>>().toEqualTypeOf(2 as const);

expectTypeOf<Modulo<7, 3>>().toEqualTypeOf(1 as const);
expectTypeOf<Modulo<7, 4>>().toEqualTypeOf(3 as const);
expectTypeOf<Modulo<7, 5>>().toEqualTypeOf(2 as const);

export type Oddly<N extends number> = N extends number
  ? Modulo<N, 2> extends 1
    ? N
    : never
  : never;

expectTypeOf<Oddly<0>>().toBeNever();
expectTypeOf<Oddly<1>>().toEqualTypeOf(1 as const);
expectTypeOf<Oddly<2>>().toBeNever();
expectTypeOf<Oddly<3>>().toEqualTypeOf(3 as const);
expectTypeOf<Oddly<4>>().toBeNever();
expectTypeOf<Oddly<5>>().toEqualTypeOf(5 as const);
expectTypeOf<Oddly<6>>().toBeNever();
expectTypeOf<Oddly<7>>().toEqualTypeOf(7 as const);

export type Wholly<N extends number> = `${N}` extends `${number}.${number}`
  ? never
  : N;

export type ParseInt<S extends string> = S extends `${infer T extends number}`
  ? T
  : never;

expectTypeOf<Wholly<0.0>>().toEqualTypeOf(0 as const);
expectTypeOf<Wholly<0.1>>().toBeNever();
expectTypeOf<Wholly<1.0>>().toEqualTypeOf(1 as const);
expectTypeOf<Wholly<1.1>>().toBeNever();

/**
 * Union of the numbers `0` through `N`, inclusive.
 *
 * @example
 * Upto<0> = 0
 * Upto<1> = 0 | 1
 * Upto<2> = 0 | 1 | 2
 * Upto<3> = 0 | 1 | 2 | 3
 */
export type Upto<N extends number> = N extends 0 ? 0 : N | Upto<Before<N>>;

expectTypeOf<0>().toEqualTypeOf<Upto<0>>();
expectTypeOf<0 | 1>().toEqualTypeOf<Upto<1>>();
expectTypeOf<0 | 1 | 2>().toEqualTypeOf<Upto<2>>();
expectTypeOf<0 | 1 | 2 | 3>().toEqualTypeOf<Upto<3>>();

/**
 * Aperiodic number generation in [-1, 1].
 */
export const weird = (n: number) => {
  return (Math.sin(n) + Math.sin(Math.PI * n)) / 2;
};

export const weave = (start: number, end: number) => (unwoven: number) =>
  start + unwoven * (end - start);

export const unweave = (start: number, end: number) => (woven: number) =>
  (woven - start) / (end - start);

export const mean = (xs: number[]) => {
  let yoke = 0;
  for (let i = 0; i < xs.length; i++) {
    yoke += xs[i];
  }
  return yoke / xs.length;
};

export const roundTo = (x: number, n: number) => {
  return Math.round(x * 10 ** n) / 10 ** n;
};

export const nooktell = (s: number, n: number) =>
  ((s - 2) * n ** 2 - n * (s - 4)) / 2;

export const inside = (greater: Element) => (smaller: Element) =>
  ((g, s) =>
    g.left < s.left &&
    g.right > s.right &&
    g.top < s.top &&
    g.bottom > s.bottom)(
    greater.getBoundingClientRect(),
    smaller.getBoundingClientRect(),
  );

export const rspan = (edge: number = 1) => edge * (2 * Math.random() - 1);
export const rtell = (n: number) => Math.floor(n * Math.random());
export const rchoose = <T>(xs: T[]): T =>
  xs[Math.floor(xs.length * Math.random())];
