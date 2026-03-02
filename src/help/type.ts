export type Assert<T> = T;
export type Maybe<T> = T | undefined;
export type Naybe<T> = T | null;
export type Write<T> = {
  -readonly [K in keyof T]: T[K];
};

export type Naybily<T> = T extends object
  ? { [K in keyof T]: T[K] | null }
  : never;

export type Maybily<T> = T extends object
  ? { [K in keyof T]: T[K] | undefined }
  : never;

export type NonNullably<T> = T extends object
  ? { [K in keyof T]: NonNullable<T[K]> }
  : never;

// type Needing<T, K extends keyof any> = Outright<
//   { [P in keyof T & K]-?: T[P] } & {
//     [P in Exclude<keyof T, K>]?: T[P];
//   }
// >;

export type Outright<T> = { [K in keyof T]: T[K] };

export type Dealing<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type Show = string | Json;

export interface Json {
  toJSON(): string;
}

export const maybeStringify = (x: unknown): string => {
  return typeof x === "string"
    ? x
    : `${JSON.stringify(
        x,
        (_, v) => {
          return v === undefined ? "undefined" : v;
        },
        2,
      )}`;
};

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
    return xs[0]!;
  } else {
    throw new Error("bad only");
  }
};

/**
 * Meant to be spread.
 *
 * @example
 * console.log(...maybeList("hello"));   // "hello"
 * console.log(...maybeList(undefined)); // ""
 *
 * @see {@linkcode shell}
 */
export const maybeList = <T>(x: T) => {
  return (x ? [x] : []) as Assert<T extends NonNullable<T> ? [T] : []>;
};

export type DeepSlice<T> = T extends object
  ? {
      [P in keyof T]?: DeepSlice<T[P]>;
    }
  : T;

export type Fandshape = {
  a: undefined;
  b: {
    c: null;
    d: {
      e: symbol;
      f: {
        g: string;
        h: {
          i: number;
          j: {
            k: boolean;
            l: {
              m: bigint;
              n: {
                o: object;
              };
            };
          };
        };
      };
    };
  };
};
