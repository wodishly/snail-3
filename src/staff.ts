import { expectTypeOf } from "vitest";

type Staves<S extends string> = S extends `${infer F}${infer R}`
  ? F | Staves<R>
  : never;

export type Staff<S extends string = string> = S extends `${infer F}${infer R}`
  ? R extends ""
    ? F
    : never
  : never;

export type Loudstaff = Exclude<Bear | Choke, Choke | "y">;
export type Bear = Staves<"aeiouy">;
export type Choke = Staves<"bcdfgklmnpqrstvxz">;

expectTypeOf([
  "a" as const,
  "b" as const,
  "c" as const,
  "d" as const,
]).toEqualTypeOf<Staves<"abcd">[]>();
