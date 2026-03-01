import type { Maybe } from "./help/type";

export type Streaming<T> = StartedStreaming<T> | UnstartedStreaming<T>;

type Startful<T> = { startTime: T };

type Streaminglike<T> = {
  goal: Maybe<T>;
  home: T;
  lifespan: number;
};

type StartedStreaming<T> = Startful<number> & Streaminglike<T>;

type UnstartedStreaming<T> = Startful<undefined> & Streaminglike<T>;

export type Stream<T> = StartedStream<T> | UnstartedStream<T>;

type Streamlike<T> = {
  /** left is old, right is new */
  done: StartedStreaming<T>[];
  /** left is soon, right is later */
  unbegun: UnstartedStreaming<T>[];
};

export type StartedStream<T> = Startful<number> &
  Streamlike<T> & {
    head: Maybe<StartedStreaming<T>>;
  };

export type UnstartedStream<T> = Startful<undefined> &
  Streamlike<T> & {
    head: undefined;
  };

export const makeStream = <T>(): UnstartedStream<T> => {
  return { startTime: undefined, head: undefined, done: [], unbegun: [] };
};

/** @mut */
export const startStream = <T>(
  now: number,
  stream: UnstartedStream<T>,
): StartedStream<T> => {
  return Object.assign(stream, {
    head: stream.unbegun.shift(),
    startTime: now,
  });
};

/** @mut */
export const step = <T>(now: number, stream: StartedStream<T>) => {
  if (!stream.head || now >= stream.head.startTime + stream.head.lifespan) {
    if (stream.head) {
      stream.done.push(stream.head);
    }
    if (stream.unbegun.length > 0) {
      stream.head = {
        ...stream.unbegun.shift()!,
        startTime: now,
      } satisfies StartedStreaming<T>;
    } else if (stream.head) {
      stream.head = undefined;
    }
  }
};
