import type { Maybe } from "./help/type";

export type Streaming<T, U = T> =
  | StartedStreaming<T, U>
  | UnstartedStreaming<T, U>;

type Startful<T> = { startTime: T };

type Streaminglike<T, U = T> = {
  goal: Maybe<T>;
  home: Maybe<U>;
  lifespan: number;
};

type StartedStreaming<T, U = T> = Startful<number> & Streaminglike<T, U>;

type UnstartedStreaming<T, U = T> = Startful<undefined> & Streaminglike<T, U>;

export type Stream<T, U = T> = StartedStream<T, U> | UnstartedStream<T, U>;

type Streamlike<T, U = T> = {
  /** left is old, right is new */
  done: StartedStreaming<T, U>[];
  /** left is soon, right is later */
  unbegun: UnstartedStreaming<T, U>[];
};

export type StartedStream<T, U = T> = Startful<number> &
  Streamlike<T, U> & { head: Head<T, U> };

export type Head<T, U = T> = Maybe<StartedStreaming<T, U>>;

export type UnstartedStream<T, U = T> = Startful<undefined> &
  Streamlike<T, U> & {
    head: undefined;
  };

export const makeStream = <T, U>(): UnstartedStream<T, U> => {
  return { startTime: undefined, head: undefined, done: [], unbegun: [] };
};

/** @mut */
export const startStream = <T, U>(
  now: number,
  stream: UnstartedStream<T, U>,
): StartedStream<T, U> => {
  return Object.assign(stream, {
    head: stream.unbegun.shift(),
    startTime: now,
  });
};

/** @mut */
export const step = <T, U>(now: number, stream: StartedStream<T, U>) => {
  if (!stream.head || now >= stream.head.startTime + stream.head.lifespan) {
    if (stream.head) {
      stream.done.push(stream.head);
    }
    if (stream.unbegun.length > 0) {
      stream.head = {
        ...stream.unbegun.shift()!,
        startTime: now,
      } satisfies StartedStreaming<T, U>;
    } else if (stream.head) {
      stream.head = undefined;
    }
  }
};
