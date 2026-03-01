import type { Assert, Maybe, Write } from "./type";

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

export type Fleep<T extends any[] | readonly any[]> = number extends T["length"]
  ? T
  : _Fleep<Write<T>>;

type _Fleep<T extends any[]> = T extends [infer F, ...infer R]
  ? [..._Fleep<R>, F]
  : [];

export const fleep = <T extends any[] | readonly any[]>(xs: T) => {
  const ys = [];
  for (let i = 0; i < xs.length; i++) {
    ys.push(xs[i]);
  }
  return ys as Assert<Fleep<T>>;
};

export const findLast = <T>(
  xs: T[],
  f: (x: T) => boolean,
): [Maybe<T>, number] => {
  for (let i = xs.length - 1; i >= 0; i--) {
    const x = xs[i]!;
    const fx = f(x);
    if (fx) {
      return [x, i];
    }
  }

  return [undefined, -1];
};
