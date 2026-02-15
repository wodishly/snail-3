import { reckonBlockTime, type Snail } from "./snail";
import { getNoiseModulator, type Throat } from "./throat";
import { type Flesh } from "./flesh";
import { nudge, clamp } from "./help/math";
import { Fastenings, Mouthbook, Settings } from "./settings";
import { makeTransient, processTransients, type Transient } from "./transient";
import { row, type Flight } from "./help/list";
import { after, type After, type Upto } from "./help/rime";
import type { Assert, Maybe } from "./help/type";

export type Berth = Upto<(typeof Mouthbook)["n"]>;
type Obstruction = Maybe<Berth>;

type Handed<T = number> = Record<"left" | "right", T>;
type Bend<T = number> = Record<"old" | "niw", T>;
type Width<T = number> = Record<"now" | "rest" | "goal" | "niw", T>;

export const makeBend = <T>(x: T): Bend<T> => {
  return { old: x, niw: x };
};

export const makeHanded = <T>(x: T): Handed<T> => {
  return { left: x, right: x };
};

export const makeWidth = <T>(x: T): Width<T> => {
  return { now: x, rest: x, goal: x, niw: x };
};

interface Hole<B, W, N extends number> {
  main: Flight<Handed, N>;

  area: Flight<number, N>;
  maxAmplitude: Flight<number, N>;
  width: Flight<W, N>;

  junctionOutput: Flight<Handed, After<N>>;
  bend: Flight<B, After<N>>;
}

export interface Mouth extends Hole<Bend, Width, (typeof Mouthbook)["n"]> {
  /** @todo yoke with {@link Mouth.overbendRight} */
  overbendLeft: Bend;
  /** @todo yoke with {@link Mouth.overbendLeft} */
  overbendRight: Bend;
  nose: Nose;
  lastObstruction: Maybe<Obstruction>;
  transients: Transient[];
  lipOutput: number;
  noseOutput: number;
  velumTarget: number;
}

export interface Nose extends Hole<
  number,
  number,
  (typeof Mouthbook)["noseLength"]
> {
  overbend: Bend;
}

const makeNose = (): Nose => {
  return {
    main: row(Mouthbook.noseLength, () => makeHanded(0)),

    area: row(Mouthbook.noseLength, () => 0),
    maxAmplitude: row(Mouthbook.noseLength, () => 0),
    width: row(Mouthbook.noseLength, () => 0),

    junctionOutput: row(after(Mouthbook.noseLength), () => makeHanded(0)),
    bend: row(after(Mouthbook.noseLength), () => 0),
    overbend: makeBend(0),
  };
};

export const makeMouth = (): Mouth => {
  return {
    main: row(Mouthbook.n, () => makeHanded(0)),

    area: row(Mouthbook.n, () => 0),
    maxAmplitude: row(Mouthbook.n, () => 0),
    width: row(Mouthbook.n, () => makeWidth(0)),

    junctionOutput: row(after(Mouthbook.n), () => makeHanded(0)),
    bend: row(after(Mouthbook.n), () => makeBend(0)),
    overbendLeft: makeBend(0),
    overbendRight: makeBend(0),

    nose: makeNose(),

    lastObstruction: undefined,
    transients: [],
    lipOutput: 0,
    noseOutput: 0,
    velumTarget: 0.01,
  };
};

export const initMouth = (mouth: Mouth) => {
  for (let i = 0; i < Mouthbook.n; i++) {
    const diameter =
      i < (7 * Mouthbook.n) / 44 - 0.5
        ? 0.6
        : i < (12 * Mouthbook.n) / 44
          ? 1.1
          : 1.5;
    mouth.width[i] = makeWidth(diameter);
  }

  for (let i = 0; i < Mouthbook.noseLength; i++) {
    const d = 2 * (i / Mouthbook.noseLength);
    mouth.nose.width[i] = Math.min(
      1.9,
      d < 1 ? 0.4 + 1.6 * d : 0.5 + 1.5 * (2 - d),
    );
  }

  calculateReflections(mouth);
  calculateNoseReflections(mouth);
  mouth.nose.width[0] = mouth.velumTarget;
};

export const finishMouthBlock = (mouth: Mouth, audioSystem: Snail) => {
  reshapeMouth(mouth, reckonBlockTime(audioSystem));
  calculateReflections(mouth);
};

export const calculateReflections = (mouth: Mouth) => {
  for (let i = 0; i < Mouthbook.n; i++) {
    mouth.area[i] = mouth.width[i].now * mouth.width[i].now; //ignoring PI etc.
  }
  for (let i = 1; i < Mouthbook.n; i++) {
    mouth.bend[i].old = mouth.bend[i].niw;
    if (mouth.area[i] === 0)
      mouth.bend[i].niw = 0.999; //to prevent some bad behaviour if 0
    else
      mouth.bend[i].niw =
        (mouth.area[i - 1] - mouth.area[i]) /
        (mouth.area[i - 1] + mouth.area[i]);
  }

  //now at junction with nose

  mouth.overbendLeft.old = mouth.overbendLeft.niw;
  mouth.overbendRight.old = mouth.overbendRight.niw;
  mouth.nose.overbend.old = mouth.nose.overbend.niw;
  const sum =
    mouth.area[Mouthbook.noseStart] +
    mouth.area[Mouthbook.noseStart + 1] +
    mouth.nose.area[0];
  mouth.overbendLeft.niw = (2 * mouth.area[Mouthbook.noseStart] - sum) / sum;
  mouth.overbendRight.niw =
    (2 * mouth.area[Mouthbook.noseStart + 1] - sum) / sum;
  mouth.nose.overbend.niw = (2 * mouth.nose.area[0] - sum) / sum;
};

export const calculateNoseReflections = (mouth: Mouth) => {
  for (let i = 0; i < Mouthbook.noseLength; i++) {
    mouth.nose.area[i] = mouth.nose.width[i] * mouth.nose.width[i];
  }
  for (let i = 1; i < Mouthbook.noseLength; i++) {
    mouth.nose.bend[i] =
      (mouth.nose.area[i - 1] - mouth.nose.area[i]) /
      (mouth.nose.area[i - 1] + mouth.nose.area[i]);
  }
};

export const addTurbulenceNoise = (
  mouth: Mouth,
  throat: Throat,
  flesh: Flesh,
  turbulenceNoise: number,
) => {
  for (let j = 0; j < flesh.mouserines.length; j++) {
    const touch = flesh.mouserines[j];
    if (touch.berth < 2 || touch.berth > Mouthbook.n) {
      continue;
    }
    if (touch.width <= 0) {
      continue;
    }

    const intensity = touch.fricativeIntensity;
    if (intensity === 0) {
      continue;
    }

    addTurbulenceNoiseAtIndex(
      mouth,
      throat,
      0.66 * turbulenceNoise * intensity,
      touch.berth,
      touch.width,
    );
  }
};

export const addTurbulenceNoiseAtIndex = (
  mouth: Mouth,
  throat: Throat,
  turbulenceNoise: number,
  index: number,
  diameter: number,
) => {
  const i = Math.floor(index);
  const delta = index - i;
  turbulenceNoise *= getNoiseModulator(throat);
  const thinness0 = clamp(8 * (0.7 - diameter), 0, 1);
  const openness = clamp(30 * (diameter - 0.3), 0, 1);
  const noise0 = turbulenceNoise * (1 - delta) * thinness0 * openness;
  const noise1 = turbulenceNoise * delta * thinness0 * openness;
  if (i + 1 < mouth.main.length) {
    mouth.main[i + 1].left += noise0 / 2;
    mouth.main[i + 1].right += noise0 / 2;
  }
  if (i + 2 < mouth.main.length) {
    mouth.main[i + 2].left += noise1 / 2;
    mouth.main[i + 2].right += noise1 / 2;
  }
};

export const reshapeMouth = (mouth: Mouth, deltaTime: number) => {
  let amount = deltaTime * Settings.speed;
  let newLastObstruction: Maybe<Obstruction> = undefined;
  for (let i = 0; i < Mouthbook.n; i++) {
    const diameter = mouth.width[i].now;
    const targetDiameter = mouth.width[i].goal;
    if (diameter <= 0) {
      newLastObstruction = i as Assert<Obstruction>;
    }
    const slowReturn =
      i < Mouthbook.noseStart
        ? 0.6
        : i >= Mouthbook.tipStart
          ? 1.0
          : 0.6 +
            (0.4 * (i - Mouthbook.noseStart)) /
              (Mouthbook.tipStart - Mouthbook.noseStart);
    mouth.width[i].now = nudge(
      diameter,
      targetDiameter,
      slowReturn * amount,
      2 * amount,
    );
  }
  if (
    mouth.lastObstruction !== undefined &&
    newLastObstruction === undefined &&
    mouth.nose.area[0] < 0.05
  ) {
    mouth.transients.push(makeTransient(mouth.lastObstruction));
  }
  mouth.lastObstruction = newLastObstruction;

  amount = deltaTime * Settings.speed;
  mouth.nose.width[0] = nudge(
    mouth.nose.width[0],
    mouth.velumTarget,
    amount * 0.25,
    amount * 0.1,
  );
  mouth.nose.area[0] = mouth.nose.width[0] ** 2;
};

export const runMouthStep = (
  mouth: Mouth,
  throat: Throat,
  snail: Snail,
  flesh: Flesh,
  glottalOutput: number,
  turbulenceNoise: number,
  lambda: number,
) => {
  var updateAmplitudes = Math.random() < 0.1;

  //mouth
  processTransients(mouth, snail);
  addTurbulenceNoise(mouth, throat, flesh, turbulenceNoise);

  mouth.junctionOutput[0].right =
    mouth.main[0].left * Fastenings.reflection.glottal + glottalOutput;
  mouth.junctionOutput[Mouthbook.n].left =
    mouth.main[Mouthbook.n - 1].right * Fastenings.reflection.lip;

  for (let i = 1; i < Mouthbook.n; i++) {
    const r = mouth.bend[i].old * (1 - lambda) + mouth.bend[i].niw * lambda;
    const w = r * (mouth.main[i - 1].right + mouth.main[i].left);
    mouth.junctionOutput[i].right = mouth.main[i - 1].right - w;
    mouth.junctionOutput[i].left = mouth.main[i].left + w;
  }

  //now at junction with nose
  const j = Mouthbook.noseStart;
  let r =
    mouth.overbendLeft.niw * (1 - lambda) + mouth.overbendLeft.old * lambda;
  mouth.junctionOutput[j].left =
    r * mouth.main[j - 1].right +
    (1 + r) * (mouth.nose.main[0].left + mouth.main[j].left);
  r = mouth.overbendRight.niw * (1 - lambda) + mouth.overbendRight.old * lambda;
  mouth.junctionOutput[j].right =
    r * mouth.main[j].left +
    (1 + r) * (mouth.main[j - 1].right + mouth.nose.main[0].left);
  r = mouth.nose.overbend.niw * (1 - lambda) + mouth.nose.overbend.old * lambda;
  mouth.nose.junctionOutput[0].right =
    r * mouth.nose.main[0].left +
    (1 + r) * (mouth.main[j].left + mouth.main[j - 1].right);

  for (let i = 0; i < Mouthbook.n; i++) {
    mouth.main[i].right = mouth.junctionOutput[i].right * 0.999;
    mouth.main[i].left = mouth.junctionOutput[i + 1].left * 0.999;

    if (updateAmplitudes) {
      const amplitude = Math.abs(mouth.main[i].right + mouth.main[i].left);
      if (amplitude > mouth.maxAmplitude[i]) {
        mouth.maxAmplitude[i] = amplitude;
      } else {
        mouth.maxAmplitude[i] *= 0.999;
      }
    }
  }

  mouth.lipOutput = mouth.main[Mouthbook.n - 1].right;

  //nose
  mouth.nose.junctionOutput[Mouthbook.noseLength].left =
    mouth.nose.main[Mouthbook.noseLength - 1].right * Fastenings.reflection.lip;

  for (let i = 1; i < Mouthbook.noseLength; i++) {
    const w =
      mouth.nose.bend[i] *
      (mouth.nose.main[i - 1].right + mouth.nose.main[i].left);
    mouth.nose.junctionOutput[i].right = mouth.nose.main[i - 1].right - w;
    mouth.nose.junctionOutput[i].left = mouth.nose.main[i].left + w;
  }

  for (let i = 0; i < Mouthbook.noseLength; i++) {
    mouth.nose.main[i].right =
      mouth.nose.junctionOutput[i].right * Settings.fade;
    mouth.nose.main[i].left =
      mouth.nose.junctionOutput[i + 1].left * Settings.fade;

    if (updateAmplitudes) {
      const amplitude = Math.abs(
        mouth.nose.main[i].right + mouth.nose.main[i].left,
      );
      if (amplitude > mouth.nose.maxAmplitude[i]) {
        mouth.nose.maxAmplitude[i] = amplitude;
      } else {
        mouth.nose.maxAmplitude[i] *= 0.999;
      }
    }
  }

  mouth.noseOutput = mouth.nose.main[Mouthbook.noseLength - 1].right;
};
