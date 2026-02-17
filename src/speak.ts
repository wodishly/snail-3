import type { Flesh } from "./flesh";
import { type W } from "./help/math";
import { makeSpan, type Assert, type Maybe } from "./help/type";
import { makeLoud, loudToTongue, type Loud } from "./loud";
import type { Mouth } from "./mouth";
import { moveTongueAndLips, type Mouthflesh } from "./mouthflesh";
import type { Tongue } from "./rine";
import type { Loudstaff } from "./staff";

export const makeSong = (): Song => {
  return { loud: undefined, step: undefined, staves: [] };
};

export const pushSpell = (song: Song, speech: HTMLInputElement) => {
  song.staves = speech.value.split("") as Assert<Loudstaff[]>;
  speech.value = "";
};

type Step = {
  step: number;
  utmost: number;
  tongue: Tongue;
};

export type Song = {
  loud: Maybe<Loud>;
  step: Maybe<Step>;
  staves: Loudstaff[];
};

export const sing = (
  song: Song,
  now: number,
  mouth: Mouth,
  flesh: Flesh,
  mouthflesh: Mouthflesh,
) => {
  if (
    (!song.loud && song.staves.length > 0) ||
    (song.loud && song.loud.time && now > song.loud.time.end)
  ) {
    // console.log("loading next loud");
    song.loud = makeLoud(song.staves.shift());
  }

  if (!song.loud) {
    // console.log("no louds left, returning");
    return;
  }

  if (song.loud.time) {
    // console.log("loud is live, returning");
    return;
  }

  // if we get here, we have a loud that's not live yet

  const goal = loudToTongue(song.loud.staff);

  if (!song.step) {
    // the `loud` isn't being stepped to yet

    let n = 15;
    song.step = {
      step: 0,
      utmost: n,
      tongue: {
        berth: (goal.berth - mouthflesh.berth) / n,
        width: (goal.width - mouthflesh.width) / n,
      },
    };
    // console.log("song step is", song.step);
  }

  if (song.step.step >= song.step.utmost) {
    // we're already there, no more stepping

    mouthflesh.berth = goal.berth;
    mouthflesh.width = goal.width;
    song.step = undefined;
    song.loud.time = makeSpan(1000/16);
    // console.log("we made it", song.loud);
  } else {
    // we step

    mouthflesh.berth += song.step.tongue.berth;
    mouthflesh.width += song.step.tongue.width;
    song.step.step += 1;
    moveTongueAndLips(
      mouthflesh,
      mouth,
      flesh,
      ["o", "u"].includes(song.loud.staff),
    );
  }
};

export const toW = ({ width, berth }: Tongue): W => {
  return { r: width, a: berth };
};

export const fromW = ({ a, r }: W): Tongue => {
  return { berth: a, width: r };
};
