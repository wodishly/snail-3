import type { Assert } from "./help/type";
import { loudToTongue } from "./loud";
import type { Mouthflesh } from "./mouthflesh";
import type { Tongue, Width } from "./rine";
import { isNosed, isRinged, isThru, type Loudstaff } from "./tung/staff";
import { type Stream, makeStream, step } from "./stream";

export type Sinewbook = {
  /** @todo */
  lip: Width;
  /** @todo */
  tongue: Tongue;
  /** in [0.01, 4] */
  sail: Width;
  /** in [0, 1] */
  lung: Width;
};

export type SinewKind = keyof Sinewbook & {};
export type Sinew<K extends SinewKind = SinewKind> = Sinewbook[K];

export type Sinews = { [K in SinewKind]: Stream<Sinew<K>> };
export interface Brain {
  sinews: Sinews;
}

export const makeBrain = (): Brain => {
  return {
    sinews: makeSinews(),
  };
};

export const think = (now: number, brain: Brain, mouthflesh: Mouthflesh) => {
  step(now, brain.sinews.lip);
  step(now, brain.sinews.tongue);
  step(now, brain.sinews.sail);
  step(now, brain.sinews.lung);

  // move mouthflesh
};

export const makeSinews = (): Sinews => {
  return {
    lip: makeStream(),
    tongue: makeStream(),
    sail: makeStream(),
    lung: makeStream(),
  };
};

/** @mut */
export const forget = (brain: Brain) => {
  Object.assign(brain, { sinews: makeSinews() });
};

/** @mut */
export const understand = (brain: Brain, { value }: HTMLInputElement) => {
  forget(brain);
  for (let t = 0; t < value.length; t++) {
    const staff = value[t] as Assert<Loudstaff>;
    if (isRinged(staff)) {
      brain.sinews.lip.tail.push(staff);
    }
    if (isNosed(staff)) {
      brain.sinews.sail.tail.push(staff);
    }
    brain.sinews.tongue.tail.push(staff);
    brain.sinews.lung.tail.push(staff);
  }
  return value.split("") as Assert<Loudstaff[]>;
};
