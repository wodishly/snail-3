import { type Assert } from "./help/type";
import type { Tongue, Width } from "./rine";
import {
  isNosed,
  isRinged,
  isStaved,
  isThru,
  type Loudstaff,
} from "./tung/staff";
import { type StartedStream, makeStream, startStream, step } from "./stream";
import { Settings } from "./settings";
import type { Being } from "./being";
import { moveTongueAndLips } from "./mouthflesh";
import { loudToTongue } from "./loud";
import { log } from "./leech";
import { weave } from "./help/rime";

export type Strength = {
  strength: number;
};

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

type Sinews = {
  [K in SinewKind]: StartedStream<Sinew<K>>;
};

export type Brain = {
  spell: Loudstaff[];
  sinews: Sinews;
};

/** @mut */
export const makeBrain = (now: number): Brain => {
  return { spell: [], sinews: makeSinews(now) };
};

export const makeSinews = (now: number): Sinews => {
  return {
    lip: startStream(now, makeStream()),
    tongue: startStream(now, makeStream()),
    sail: startStream(now, makeStream()),
    lung: startStream(now, makeStream()),
  };
};

/** @mut */
export const think = (being: Being) => {
  const { now, brain, mouth, flesh, mouthflesh } = being;

  step(now, brain.sinews.lip);
  step(now, brain.sinews.tongue);
  step(now, brain.sinews.sail);
  step(now, brain.sinews.lung);

  const head = brain.sinews.tongue.head;
  if (head && head.goal) {
    log(head, now, "think");
    const weft = (2.5 * (now - head.startTime)) / Settings.beat;
    const goalwards =
      weft >= 1
        ? head.goal
        : {
            berth: weave(head.home.berth, head.goal.berth)(weft),
            width: weave(head.home.width, head.goal.width)(weft),
          };
    mouthflesh.berth = goalwards.berth;
    mouthflesh.width = goalwards.width;
    // @todo better handling of ringedness
    moveTongueAndLips(goalwards, mouth, flesh, isRinged(head.goal.staff));
  }
};

/** @mut */
export const understand = (
  now: number,
  brain: Brain,
  input: HTMLInputElement,
): void => {
  brain.spell = input.value.split("") as Assert<Loudstaff[]>;
  brain.sinews = makeSinews(now);

  for (let t = 0; t < input.value.length; t++) {
    const thisStaff = input.value[t] as Assert<Loudstaff>;
    const lastSinewGoals =
      t > 0
        ? {
            lip: brain.sinews.lip.unbegun.at(-1)?.goal,
            tongue: brain.sinews.tongue.unbegun.at(-1)?.goal,
            sail: brain.sinews.sail.unbegun.at(-1)?.goal,
            lung: brain.sinews.lung.unbegun.at(-1)?.goal,
          }
        : undefined;
    brain.sinews.lip.unbegun.push({
      goal: isRinged(thisStaff)
        ? { width: isThru(thisStaff) ? 4 : 1, staff: thisStaff }
        : undefined,
      lifespan: Settings.beat,
      startTime: undefined,
      home: structuredClone(lastSinewGoals?.lip) ?? {
        ...Settings.start.lip,
        staff: "" as Assert<Loudstaff>,
      },
    });
    brain.sinews.tongue.unbegun.push({
      goal: { staff: thisStaff, ...loudToTongue(thisStaff) },
      lifespan: Settings.beat,
      startTime: undefined,
      home: structuredClone(lastSinewGoals?.tongue) ?? {
        ...Settings.start.mouthflesh,
        staff: "" as Assert<Loudstaff>,
      },
    });
    brain.sinews.sail.unbegun.push({
      goal: isNosed(thisStaff) ? { width: 0.01, staff: thisStaff } : undefined,
      lifespan: Settings.beat,
      startTime: undefined,
      home: structuredClone(lastSinewGoals?.sail) ?? {
        ...Settings.start.sail,
        staff: "" as Assert<Loudstaff>,
      },
    });
    brain.sinews.lung.unbegun.push({
      goal: isStaved(thisStaff) ? { strength: 1, staff: thisStaff } : undefined,
      lifespan: Settings.beat,
      startTime: undefined,
      home: structuredClone(lastSinewGoals?.lung) ?? {
        ...Settings.start.lung,
        staff: "" as Assert<Loudstaff>,
      },
    });
  }
};
