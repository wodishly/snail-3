import type { Maybe } from "./help/type";

interface Starting<T extends Maybe<number> = Maybe<number>> {
  start: T;
}

export interface Streaming<
  T,
  U extends Maybe<number> = Maybe<number>,
> extends Starting<U> {
  goal: Maybe<T>;
  lifespan: number;
}

export interface Stream<
  T,
  U extends Maybe<number> = Maybe<number>,
> extends Starting<U> {
  done: Streaming<T, number>[];
  unbegun: Streaming<T, undefined>[];
  tell: number;
}

export const makeStream = <T>(): Stream<T, undefined> => {
  return { start: undefined, list: [], tell: 0 };
};

/** @mut */
export const startStream = <T>(
  now: number,
  stream: Stream<T, undefined>,
): Stream<T, number> => {
  return Object.assign(stream, { start: now });
};

export const step = <T>(now: number, stream: Stream<T, number>) => {
  if (now >= stream.list[0].start + stream.list[0].lifespan) {
    stream.tell += 1;
  }
  if (!stream.head && stream.tail.length > 0) {
    stream.head = stream.tail.pop();
  }
};
