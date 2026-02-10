import type { Assert } from "./type";

export type Twain<T = number> = Flight<T, 2>;
export type Twainlist<T = number> = T[];

export type Flight<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : Fledge<T, N, []>
  : never;
type Fledge<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : Fledge<T, N, [T, ...R]>;

export const flight = <N extends number>(n: N) => {
  const xs = [];
  for (let i = 0; i < n; i++) {
    xs.push(i);
  }
  return xs as Assert<Flight<number, N>>;
};

export const sameshift = <N extends number, T extends Flight<T[number], N>, U>(
  xs: T,
  f: (x: T[number]) => U,
) => {
  const ys = [];
  for (let i = 0; i < xs.length; i++) {
    ys.push(f(xs[i]));
  }
  return ys as Assert<{ [K in keyof T]: U }>;
};

export const row = <N extends number, T>(n: N, f: (x: number) => T) => {
  return sameshift(flight(n), f);
};

export const f64row = <N extends number, T extends number>(
  n: N,
  f: (x: number) => T,
) => {
  const row = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    row[i] = f(n);
  }
  return row;
};
