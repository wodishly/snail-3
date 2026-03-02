import { type Assert, type Maybe, type Maybily } from "./help/type";
import type { Tongue, Widthful } from "./rine";
import { isBody, unstaff, type Loudstaff } from "./tung/staff";
import {
  type Head,
  type StartedStream,
  makeStream,
  startStream,
  step,
} from "./stream";
import { Fastenings, Mouthbook, Settings } from "./settings";
import type { Being } from "./being";
import { loudToSinewing } from "./loud";
import { weave } from "./help/rime";
import { canvasToTongue } from "./canvas";
import { clamp } from "./help/math";
import type { Mouth } from "./mouth";
import type { Throat } from "./throat";
import type { Mouthflesh } from "./mouthflesh";
import { log } from "./leech";

export type Strengthful = {
  strength: number;
};

/** @todo ugly */
export const sinews = ["lip", "tongue", "sail", "lung"] as const;

/** A stirring of the four sinews. */
export type Sinewing = {
  /** @todo */
  lip: Widthful;
  /** @todo */
  tongue: Tongue;
  /** in [0.01, 4] */
  sail: Widthful;
  /** in [0, 1] */
  lung: Strengthful;
};

export type SinewKind = keyof Sinewing & {};
export type Sinew<K extends SinewKind = SinewKind> = Sinewing[K] & {
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
export const understand = (
  now: number,
  brain: Brain,
  throat: Throat,
  mouth: Mouth,
  mouthflesh: Mouthflesh,
  input: HTMLInputElement,
): void => {
  const wah = `${input.value}a`;
  brain.spell = wah.split("") as Assert<Loudstaff[]>;
  brain.sinews = makeSinews(now);

  for (let t = 0; t < wah.length; t++) {
    const thisStaff = wah[t] as Assert<Loudstaff>;
    const lastSinewGoals = {
      lip: brain.sinews.lip.unbegun.at(-1)?.goal ?? {
        width: mouth.width[43].rest,
        staff: unstaff(),
      },
      tongue: brain.sinews.tongue.unbegun.at(-1)?.goal ?? {
        width: mouthflesh.width,
        berth: mouthflesh.berth,
        staff: unstaff(),
      },
      sail: brain.sinews.sail.unbegun.at(-1)?.goal ?? {
        width: mouth.sailgoal,
        staff: unstaff(),
      },
      lung: brain.sinews.lung.unbegun.at(-1)?.goal ?? {
        strength: throat.intensity,
        staff: unstaff(),
      },
    };
    const sinewing = loudToSinewing(thisStaff);

    brain.sinews.lip.unbegun.push({
      goal: { ...sinewing.lip, staff: thisStaff },
      lifespan: Settings.beat,
      startTime: undefined,
      home: lastSinewGoals?.lip,
    });
    brain.sinews.tongue.unbegun.push({
      goal: { ...sinewing.tongue, staff: thisStaff },
      lifespan: Settings.beat,
      startTime: undefined,
      home: lastSinewGoals?.tongue,
    });
    brain.sinews.sail.unbegun.push({
      goal: { ...sinewing.sail, staff: thisStaff },
      lifespan: Settings.beat,
      startTime: undefined,
      home: lastSinewGoals?.sail,
    });
    brain.sinews.lung.unbegun.push({
      goal: { ...sinewing.lung, staff: thisStaff },
      lifespan: Settings.beat,
      startTime: undefined,
      home: lastSinewGoals?.lung,
    });
  }
};

/** @mut */
export const think = (being: Being) => {
  const { now, brain, mouth, mouthflesh } = being;

  if (
    !brain.sinews.lip.head &&
    !brain.sinews.lip.unbegun.length &&
    !brain.sinews.tongue.head &&
    !brain.sinews.tongue.unbegun.length &&
    !brain.sinews.sail.head &&
    !brain.sinews.sail.unbegun.length &&
    !brain.sinews.lung.head &&
    !brain.sinews.lung.unbegun.length
  ) {
    return;
  }

  step(now, brain.sinews.lip);
  step(now, brain.sinews.tongue);
  step(now, brain.sinews.sail);
  step(now, brain.sinews.lung);

  const sinewing = makeSinewing(being, {
    lip: reckonLips(now, brain.sinews.lip.head),
    tongue: reckonTongue(now, brain.sinews.tongue.head),
    lung: reckonLung(now, brain.sinews.lung.head),
    sail: reckonSail(now, brain.sinews.sail.head),
  });

  const staff = brain.sinews.tongue.head?.goal?.staff;
  log(sinewing, staff);
  if (staff) {
    if (isBody(staff)) {
      mouthflesh.berth = sinewing.tongue.berth;
      mouthflesh.width = sinewing.tongue.width;
    }
    lip(mouth, sinewing.lip.width);
    blade(mouth, sinewing.tongue.width);
    sail(mouth, sinewing.sail.width);
  }

  moveTongueAndLips(being, sinewing);
};

const reckonLung = (
  now: number,
  head: Head<Sinew<"lung">>,
): Maybe<Strengthful> => {
  if (!head || !head.goal || !head.home) {
    return;
  }
  const weft = (2.5 * (now - head.startTime)) / Settings.beat;

  return weft >= 1
    ? head.goal
    : {
        strength: weave(head.home.strength, head.goal.strength)(weft),
      };
};

const reckonTongue = (
  now: number,
  head: Head<Sinew<"tongue">>,
): Maybe<Tongue> => {
  if (!head || !head.goal || !head.home) {
    return;
  }
  const weft = (2.5 * (now - head.startTime)) / Settings.beat;

  return weft >= 1
    ? head.goal
    : {
        berth: weave(head.home.berth, head.goal.berth)(weft),
        width: weave(head.home.width, head.goal.width)(weft),
      };
};

const reckonLips = (now: number, head: Head<Sinew<"lip">>): Maybe<Widthful> => {
  if (!head || !head.goal || !head.home) {
    return;
  }
  const weft = (2.5 * (now - head.startTime)) / Settings.beat;
  return weft >= 1
    ? head.goal
    : {
        width: weave(head.home.width, head.goal.width)(weft),
      };
};

const reckonSail = (
  now: number,
  head: Head<Sinew<"sail">>,
): Maybe<Widthful> => {
  if (!head || !head.goal || !head.home) {
    return;
  }
  const weft = (2.5 * (now - head.startTime)) / Settings.beat;
  return weft >= 1
    ? head.goal
    : {
        width: weave(head.home.width, head.goal.width)(weft),
      };
};

export const makeSinewing = (
  being: Pick<Being, "throat" | "mouth" | "mouthflesh">,
  sinewing: Partial<Maybily<Sinewing>> = {},
): Sinewing => {
  const { throat, mouth, mouthflesh } = being;
  return {
    lip: sinewing.lip ?? { width: mouth.width[43].rest },
    tongue: sinewing.tongue ?? {
      width: mouthflesh.width,
      berth: mouthflesh.berth,
    },
    sail: sinewing.sail ?? { width: mouth.sailgoal },
    lung: sinewing.lung ?? { strength: throat.intensity },
  };
};

export const moveTongueAndLips = (
  being: Pick<Being, "throat" | "mouth" | "flesh" | "mouthflesh">,
  sinewing: Sinewing,
) => {
  const { mouth, flesh, mouthflesh } = being;
  // first, bearing looseness

  setRestWidth(being, sinewing);

  // set goal widths to rest widths
  for (let i = 0; i < Mouthbook.length; i++) {
    mouth.width[i]!.goal = mouth.width[i]!.rest;
  }

  // then, choking tightness

  mouth.sailgoal = mouthflesh.gay ? Fastenings.sail.gay : Fastenings.sail.rest;

  for (let j = 0; j < flesh.mouserines.length; j++) {
    const rine = flesh.mouserines[j]!;
    if (!rine.isDown) {
      continue;
    }

    gesture(being, canvasToTongue(rine));
  }
};

const gesture = (being: Pick<Being, "mouth">, { berth, width }: Tongue) => {
  const { mouth } = being;
  if (berth > Mouthbook.noseStart && width < -Settings.mouthflesh.noseOffset) {
    sail(mouth);
  }
  if (width < -0.85 - Settings.mouthflesh.noseOffset) {
    // noseworthy rines skip the forthcoming mouthreckoning
    return;
  }

  // nudge the width so that `<= 0` iff fully shut
  const cookedWidth = Math.max(width - 0.3, 0);

  // vocal tract length?
  const length = 5 + 5 * clamp(1 - (berth - 25) / (Mouthbook.bladeStart - 25));
  if (berth >= 2 && berth < Mouthbook.length && cookedWidth < 3) {
    // clicked in mouth hole
    const wholeBerth = Math.round(berth);
    for (let i = -Math.ceil(length) - 1; i < length + 1; i++) {
      if (wholeBerth + i < 0 || Mouthbook.length <= wholeBerth + i) {
        continue;
      }

      if (cookedWidth < mouth.width[wholeBerth + i]!.goal) {
        // reckon farth (in either way) from rinenavel
        const farth = Math.abs(wholeBerth + i - berth) - 0.5;
        const goal = weave(
          cookedWidth,
          mouth.width[wholeBerth + i]!.goal,
        )(0.5 * (1 - Math.cos((Math.PI * clamp(farth, 0, length)) / length)));
        reach(mouth, wholeBerth + i, goal);
      }
    }
  }
};

/**
 * Sets the new rest widths for the given tongue berth and width.
 */
export const setRestWidth = (
  being: Pick<Being, "throat" | "mouth">,
  sinewing: Sinewing,
) => {
  const { throat, mouth } = being;
  const { tongue, lung } = sinewing;

  throat.intensity = lung.strength;

  for (let i = Mouthbook.bodyStart; i < Mouthbook.lipStart; i++) {
    const t =
      (1.1 * Math.PI * (tongue.berth - i)) /
      (Mouthbook.bladeStart - Mouthbook.bodyStart);
    const fixedTongueDiameter = 2 + (tongue.width - 2) / 1.5;
    let curve =
      (1.5 - fixedTongueDiameter + Settings.mouthflesh.gridOffset) *
      Math.cos(t);
    if (i === Mouthbook.bodyStart - 2 || i === Mouthbook.lipStart - 1) {
      curve *= 0.8;
    }
    if (i === Mouthbook.bodyStart || i === Mouthbook.lipStart - 2) {
      curve *= 0.94;
    }
    mouth.width[i].rest = 1.5 - curve;
  }
};

const lip = (mouth: Mouth, width: number) => {
  for (let i = Mouthbook.lipStart; i < Mouthbook.length; i++) {
    mouth.width[i].rest = width;
  }
};

const blade = (mouth: Mouth, width: number) => {
  for (let i = Mouthbook.bladeStart; i < Mouthbook.lipStart; i++) {
    mouth.width[i].rest = width;
  }
};

/** @mut */
const sail = (mouth: Mouth, sailgoal: number = 0.4) => {
  mouth.sailgoal = sailgoal;
  mouth.nose.width[0] = sailgoal;
};

/**
 * @mut
 * @todo type `berth` as `Upto<(typeof Mouthbook)["length"]>`
 */
const reach = (mouth: Mouth, berth: number, goal: number) => {
  mouth.width[berth]!.goal = goal;
};

log;
