import { expectTypeOf } from "vitest";
import type { Assert } from "./type";

type Not<P extends boolean> = P extends true ? false : true;

export const not = <P extends boolean>(p: P) => {
  return !p as Assert<Not<P>>;
};

type Or<Ps extends boolean[]> = Ps extends [
  infer P extends boolean,
  ...infer Qs extends boolean[],
]
  ? P extends true
    ? true
    : Or<Qs>
  : false;

expectTypeOf<Or<[]>>().toEqualTypeOf<false>();
expectTypeOf<Or<[true]>>().toEqualTypeOf<true>();
expectTypeOf<Or<[false]>>().toEqualTypeOf<false>();
expectTypeOf<Or<[true, true]>>().toEqualTypeOf<true>();
expectTypeOf<Or<[true, false]>>().toEqualTypeOf<true>();
expectTypeOf<Or<[false, true]>>().toEqualTypeOf<true>();
expectTypeOf<Or<[false, false]>>().toEqualTypeOf<false>();

export const or = <Ps extends boolean[]>(...ps: Ps) => {
  return ps.some((p) => p) as Assert<Or<Ps>>;
};

type And<Ps extends boolean[]> = Ps extends [
  infer P extends boolean,
  ...infer Qs extends boolean[],
]
  ? P extends false
    ? false
    : And<Qs>
  : true;

expectTypeOf<And<[]>>().toEqualTypeOf<true>();
expectTypeOf<And<[true]>>().toEqualTypeOf<true>();
expectTypeOf<And<[false]>>().toEqualTypeOf<false>();
expectTypeOf<And<[true, true]>>().toEqualTypeOf<true>();
expectTypeOf<And<[true, false]>>().toEqualTypeOf<false>();
expectTypeOf<And<[false, true]>>().toEqualTypeOf<false>();
expectTypeOf<And<[false, false]>>().toEqualTypeOf<false>();

export const and = <Ps extends boolean[]>(...ps: Ps) => {
  return ps.every((p) => p) as Assert<And<Ps>>;
};

type If<P extends boolean, Q extends boolean> = P extends false
  ? true
  : Q extends true
    ? true
    : false;

expectTypeOf<If<true, true>>().toEqualTypeOf<true>();
expectTypeOf<If<true, false>>().toEqualTypeOf<false>();
expectTypeOf<If<false, true>>().toEqualTypeOf<true>();
expectTypeOf<If<false, false>>().toEqualTypeOf<true>();

export const lif = <P extends boolean, Q extends boolean>(p: P, q: Q) => {
  return (!p || q) as Assert<If<P, Q>>;
};
