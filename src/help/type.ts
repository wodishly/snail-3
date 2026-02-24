export type Assert<T> = T;
export type Maybe<T> = T | undefined;
export type Naybe<T> = T | null;
export type Write<T> = {
  -readonly [K in keyof T]: T[K];
};

export type Dealing<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Show = string | Json;

export interface Json {
  toJSON(): string;
}

export type Span<T = number> = {
  start: T;
  end: T;
};

/**
 * @param length in thousandths of ticks
 */
export const makeSpan = (length: number, start = performance.now()): Span => {
  return {
    start,
    end: start + length,
  };
};

export const ly = <T>(x: T) => {
  console.log(x);
  return x;
};

export const only = <T>(xs: T[]): T => {
  if (xs.length === 1) {
    return xs[0];
  } else {
    throw new Error("bad only");
  }
};

export const maybe = <T>(x: T) => {
  return (x ? [x] : []) as Assert<T extends NonNullable<T> ? [T] : []>;
};
