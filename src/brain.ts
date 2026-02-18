import type { Maybe } from "./help/type";
import { loudToTongue, type Loud } from "./loud";
import type { Tongue } from "./rine";

type Lip = Tongue;

interface Stream<D extends Dying> {
  head: Maybe<D>;
  rest: D[];
}

interface Dying {
  start: number;
  lifespan: number;
}

interface DyingSinew extends Sinew, Dying {}

interface Sinew {
  loud: Loud;
  tongue: Tongue;
  lip: Lip;
}

export interface Brain extends Stream<Sinew> {}

export const makeSinew = (loud: Loud, lifespan: number): Sinew => {
  return {
    start: performance.now() / 1000,
    lifespan,
    loud,
    ...loudToTongue(loud),
  };
};

export const makeBrain = (): Brain => {
  return makeThread();
};

export const makeThread = <T extends Dying>(): Stream<T> => {
  return { head: undefined, rest: [] };
};

export const think = (brain: Brain, now: number) => {
  if (brain.head && now > brain.head.start + brain.head.lifespan) {
    brain.head = undefined;
  }
  if (brain.head === undefined && brain.rest.length) {
    brain.head = brain.rest.shift();
  }
  return;
};
