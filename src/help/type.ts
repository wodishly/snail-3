export type Assert<T> = T;
export type Maybe<T> = T | undefined;
export type Write<T> = {
  -readonly [K in keyof T]: T[K];
};

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
