import type { Assert, Dealing, Maybe } from "./help/type";
import type { Mouthflesh } from "./mouthflesh";
import type { Tongue, Width } from "./rine";
import {
  isNosed,
  isRinged,
  isStaved,
  isThru,
  type Loudstaff,
} from "./tung/staff";
import {
  type StartedStream,
  type UnstartedStream,
  makeStream,
  startStream,
  step,
} from "./stream";
import { Settings } from "./settings";

export interface Strength {
  strength: number;
}

/** @todo ugly */
export const sinews = ["lip", "tongue", "sail", "lung"] as const;

export type Sinewbook = {
  /** @todo */
  lip: Width;
  /** @todo */
  tongue: Tongue;
  /** in [0.01, 4] */
  sail: Width;
  /** in [0, 1] */
  lung: Strength;
};

export type SinewKind = keyof Sinewbook & {};
export type Sinew<K extends SinewKind = SinewKind> = Sinewbook[K] & {
  staff: Loudstaff;
};

type AlmostSinews = {
  [K in SinewKind]: UnstartedStream<Sinew<K>>;
};

type Sinews = {
  [K in SinewKind]: StartedStream<Sinew<K>>;
};

export interface Brain {
  now: number;
  spell: Maybe<Loudstaff[]>;
  sinews: Sinews;
}

export const makeBrain = (now: number): Brain => {
  return wakeBrain({ now, spell: undefined });
};

export const wakeBrain = (almostBrain: Dealing<Brain, "sinews">): Brain => {
  const almostSinews = makeSinews();

  const sinews = {
    lip: startStream(almostBrain.now, almostSinews.lip),
    tongue: startStream(almostBrain.now, almostSinews.tongue),
    sail: startStream(almostBrain.now, almostSinews.sail),
    lung: startStream(almostBrain.now, almostSinews.lung),
  };

  return Object.assign(almostBrain, { sinews });
};

/** @mut */
export const think = (now: number, brain: Brain, mouthflesh: Mouthflesh) => {
  step(now, brain.sinews.lip);
  step(now, brain.sinews.tongue);
  step(now, brain.sinews.sail);
  step(now, brain.sinews.lung);

  brain.now = now;

  // move mouthflesh
};

export const makeSinews = (): AlmostSinews => {
  return {
    lip: makeStream(),
    tongue: makeStream(),
    sail: makeStream(),
    lung: makeStream(),
  };
};

/** @mut */
export const understand = (brain: Brain, input: HTMLInputElement) => {
  forget(brain, input);

  for (let t = 0; t < input.value.length; t++) {
    const staff = input.value[t] as Assert<Loudstaff>;
    brain.sinews.lip.unbegun.push({
      goal: isRinged(staff)
        ? { width: isThru(staff) ? 4 : 1, staff }
        : undefined,
      lifespan: Settings.beat,
      start: undefined,
    });
    brain.sinews.sail.unbegun.push({
      goal: isNosed(staff) ? { width: 0.01, staff } : undefined,
      lifespan: Settings.beat,
      start: undefined,
    });
    brain.sinews.tongue.unbegun.push({
      goal: { width: 2, berth: 19, staff },
      lifespan: Settings.beat,
      start: undefined,
    });
    brain.sinews.lung.unbegun.push({
      goal: isStaved(staff) ? { strength: 1, staff } : undefined,
      lifespan: Settings.beat,
      start: undefined,
    });
  }

  // wipe(input);
};

/** @mut */
export const forget = (brain: Brain, input: HTMLInputElement) => {
  Object.assign(brain, { sinews: makeSinews(), spell: input.value });
};

/** @mut */
export const wipe = (input: HTMLInputElement) => {
  input.value = "";
};
