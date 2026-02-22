import type { Assert } from "./help/type";

type Not<P extends boolean> = P extends true ? false : true;

export const not = <P extends boolean>(p: P) => {
  return !p as Assert<Not<P>>;
};

type Or<P extends boolean, Q extends boolean> = P | Q extends false
  ? false
  : true;

type Ors<Ps extends boolean[]> = Ps extends [
  infer P extends boolean,
  ...infer Qs extends boolean[],
]
  ? Or<P, Ors<Qs>>
  : false;

export const or = <P extends boolean, Q extends boolean>(p: P, q: Q) => {
  return (p || q) as Assert<Or<P, Q>>;
};

export const ors = <Ps extends boolean[]>(...ps: Ps) => {
  return ps.some((p) => p) as Assert<Ors<Ps>>;
};

type And<P extends boolean, Q extends boolean> = true extends P & Q
  ? true
  : false;

type Ands<Ps extends boolean[]> = Ps extends [
  infer P extends boolean,
  ...infer Qs extends boolean[],
]
  ? And<P, Ands<Qs>>
  : true;

export const and = <P extends boolean, Q extends boolean>(p: P, q: Q) => {
  return (p && q) as Assert<And<P, Q>>;
};

export const ands = <Ps extends boolean[]>(...ps: Ps) => {
  return ps.every((p) => p) as Assert<Ands<Ps>>;
};
