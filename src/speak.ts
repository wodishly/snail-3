import type { Flesh } from "./flesh";
import { farthW, less, lessW, type W } from "./help/math";
import { makeSpan, type Assert, type Maybe } from "./help/type";
import { makeLoud, loudToTongue, type Loud } from "./loud";
import type { Mouth } from "./mouth";
import { moveTongue, type Mouthflesh } from "./mouthflesh";
import type { Tongue } from "./rine";
import type { Loudstaff } from "./staff";

export const makeSong = (): Song => {
  return { loud: undefined, step: undefined, staves: [] };
};

export const pushSpell = (
  song: Song,
  speech: HTMLInputElement,
  speak: HTMLButtonElement,
) => {
  song.staves = speech.value.split("") as Assert<Loudstaff[]>;
};

export type Song = {
  loud: Maybe<Loud>;
  step: Maybe<Tongue>;
  staves: Loudstaff[];
};

export const sing = (
  song: Song,
  now: number,
  mouth: Mouth,
  flesh: Flesh,
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
) => {
  if (
    song.staves.length > 0 &&
    (song.loud === undefined ||
      song.loud.time === undefined ||
      now > song.loud.time.end)
  ) {
    song.loud = makeLoud(song.staves.shift());
  }

  if (song.loud) {
    const goal = loudToTongue(song.loud.staff);

    if (!song.loud.time) {
      // the `loud` isn't live yet

      if (!song.step) {
        // the `loud` isn't being stepped to yet

        song.step = {
          berth: (goal.berth - mouthflesh.berth) / 30,
          width: (goal.width - mouthflesh.width) / 30,
        };
        console.log("song step is", song.step);
      }

      if (farthW(toW(goal), toW(mouthflesh)) < 0.3) {
        // we're already there, no more stepping

        mouthflesh.berth = goal.berth;
        mouthflesh.width = goal.width;
        song.step = undefined;
        song.loud.time = makeSpan(250);
        console.log("we made it", song.loud);
      } else {
        console.log("step");
        // we step

        mouthflesh.berth += song.step.berth;
        mouthflesh.width += song.step.width;
        moveTongue(mouthflesh, mouth, flesh, context);
      }
    }
  }
};

export const toW = ({ width, berth }: Tongue): W => {
  return { r: width, a: berth };
};

export const fromW = ({ a, r }: W): Tongue => {
  return { berth: a, width: r };
};
