export type Assert<T> = T;
export type Maybe<T> = T | undefined;
export type Write<T> = {
  -readonly [K in keyof T]: T[K];
};
