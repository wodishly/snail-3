import type { Maybe } from "./help/type";

export type Streaming<T> = StartedStreaming<T> | UnstartedStreaming<T>;

interface Started {
  start: number;
}

interface Unstarted {
  start: undefined;
}

interface Streaminglike<T> {
  goal: Maybe<T>;
  lifespan: number;
}

interface StartedStreaming<T> extends Started, Streaminglike<T> {}

interface UnstartedStreaming<T> extends Unstarted, Streaminglike<T> {}

export type Stream<T> = StartedStream<T> | UnstartedStream<T>;

interface Streamlike<T> {
  done: StartedStreaming<T>[];
  unbegun: UnstartedStreaming<T>[];
}

export interface StartedStream<T> extends Started, Streamlike<T> {
  head: StartedStreaming<T>;
}

export interface UnstartedStream<T> extends Unstarted, Streamlike<T> {
  head: undefined;
}

export const makeStream = <T>(): UnstartedStream<T> => {
  return { start: undefined, head: undefined, done: [], unbegun: [] };
};

/** @mut */
export const startStream = <T>(
  now: number,
  stream: UnstartedStream<T>,
): StartedStream<T> => {
  return Object.assign(stream, { head: stream.unbegun.shift(), start: now });
};

/** @mut */
export const endStream = <T>(stream: StartedStream<T>) => {
  return Object.assign(stream, { head: undefined });
};

/** @mut */
export const step = <T>(now: number, stream: StartedStream<T>) => {
  if (!stream.head || now >= stream.head.start + stream.head.lifespan) {
    if (stream.head) {
      stream.done.push(stream.head);
    }
    if (stream.unbegun.length > 0) {
      stream.head = { ...stream.unbegun.shift()!, start: now };
    } else if (stream.head) {
      endStream(stream);
    }
  }
};
