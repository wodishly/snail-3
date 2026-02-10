import { reckonBlockTime, type Snail } from "./snail";
import { getNoiseModulator, type Throat } from "./throat";
import { type UiType } from "./ui";
import { nudge, clamp } from "./help/math";
import { Fastenings, Mouthbook, Settings } from "./settings";
import { makeTransient, processTransients, type Transient } from "./transient";
import { row, type Flight } from "./help/list";
import { after, type After, type Upto } from "./help/rime";
import type { Assert, Maybe } from "./help/type";

export type TractType = ReturnType<typeof makeTract>;

export type Berth = Upto<(typeof Mouthbook)["n"]>;
type Obstruction = Maybe<Berth>;

type Handed<T = number> = Record<"left" | "right", T>;
type Bend<T = number> = Record<"old" | "niw", T>;
type Width<T = number> = Record<"now" | "rest" | "goal" | "niw", T>;
type Mouthful<T = number> = Flight<T, (typeof Mouthbook)["n"]>;
type Overmouthful<T = number> = Flight<T, After<(typeof Mouthbook)["n"]>>;

export const makeBend = <T>(x: T): Bend<T> => {
  return { old: x, niw: x };
};

export const makeHanded = <T>(x: T): Handed<T> => {
  return { left: x, right: x };
};

export const makeWidth = <T>(x: T): Width<T> => {
  return { now: x, rest: x, goal: x, niw: x };
};

export type Mouth = {
  main: Mouthful<Handed>;
  junctionOutput: Overmouthful<Handed>;
  reflection: Overmouthful<Bend>;
  maxAmplitude: Mouthful;
  width: Mouthful<Width>;
  nose: Nose;

  area: Mouthful;
};

export type Nose = {};

export const makeTract = () => {
  return {
    main: row(Mouthbook.n, () => makeHanded(0)),
    junctionOutput: row(after(Mouthbook.n), () => makeHanded(0)),
    bend: row(after(Mouthbook.n), () => makeBend(0)),
    area: row(Mouthbook.n, () => 0),
    maxAmplitude: row(Mouthbook.n, () => 0),
    width: row(Mouthbook.n, () => makeWidth(0)),

    nose: {
      main: row(Mouthbook.noseLength, () => makeHanded(0)),
      junctionOutput: row(after(Mouthbook.noseLength), () => makeHanded(0)),
      area: row(Mouthbook.noseLength, () => 0),
      maxAmplitude: row(Mouthbook.noseLength, () => 0),
      width: row(Mouthbook.noseLength, () => 0),
      bend: row(after(Mouthbook.noseLength), () => 0),
    },

    reflectionLeft: 0,
    reflectionRight: 0,
    reflectionNose: 0,

    newReflectionLeft: 0,
    newReflectionRight: 0,
    newReflectionNose: 0,

    lastObstruction: undefined as Maybe<Obstruction>,
    transients: [] as Transient[],
    lipOutput: 0,
    noseOutput: 0,
    velumTarget: 0.01,
  };
};

export const initTract = (tract: TractType) => {
  for (var i = 0; i < Mouthbook.n; i++) {
    var diameter = 0;
    if (i < (7 * Mouthbook.n) / 44 - 0.5) diameter = 0.6;
    else if (i < (12 * Mouthbook.n) / 44) diameter = 1.1;
    else diameter = 1.5;
    tract.width[i] = makeWidth(diameter);
  }

  for (let i = 0; i < Mouthbook.noseLength; i++) {
    const d = 2 * (i / Mouthbook.noseLength);
    tract.nose.width[i] = Math.min(
      1.9,
      d < 1 ? 0.4 + 1.6 * d : 0.5 + 1.5 * (2 - d),
    );
  }
  tract.newReflectionLeft =
    tract.newReflectionRight =
    tract.newReflectionNose =
      0;
  calculateReflections(tract);
  calculateNoseReflections(tract);
  tract.nose.width[0] = tract.velumTarget;
};

export const finishTractBlock = (tract: TractType, audioSystem: Snail) => {
  reshapeTract(tract, reckonBlockTime(audioSystem));
  calculateReflections(tract);
};

export const calculateReflections = (tract: TractType) => {
  for (var i = 0; i < Mouthbook.n; i++) {
    tract.area[i] = tract.width[i].now * tract.width[i].now; //ignoring PI etc.
  }
  for (var i = 1; i < Mouthbook.n; i++) {
    tract.bend[i].old = tract.bend[i].niw;
    if (tract.area[i] == 0)
      tract.bend[i].niw = 0.999; //to prevent some bad behaviour if 0
    else
      tract.bend[i].niw =
        (tract.area[i - 1] - tract.area[i]) /
        (tract.area[i - 1] + tract.area[i]);
  }

  //now at junction with nose

  tract.reflectionLeft = tract.newReflectionLeft;
  tract.reflectionRight = tract.newReflectionRight;
  tract.reflectionNose = tract.newReflectionNose;
  var sum =
    tract.area[Mouthbook.noseStart] +
    tract.area[Mouthbook.noseStart + 1] +
    tract.nose.area[0];
  tract.newReflectionLeft = (2 * tract.area[Mouthbook.noseStart] - sum) / sum;
  tract.newReflectionRight =
    (2 * tract.area[Mouthbook.noseStart + 1] - sum) / sum;
  tract.newReflectionNose = (2 * tract.nose.area[0] - sum) / sum;
};

export const calculateNoseReflections = (tract: TractType) => {
  for (var i = 0; i < Mouthbook.noseLength; i++) {
    tract.nose.area[i] = tract.nose.width[i] * tract.nose.width[i];
  }
  for (var i = 1; i < Mouthbook.noseLength; i++) {
    tract.nose.bend[i] =
      (tract.nose.area[i - 1] - tract.nose.area[i]) /
      (tract.nose.area[i - 1] + tract.nose.area[i]);
  }
};

export const addTurbulenceNoise = (
  tract: TractType,
  glottis: Throat,
  ui: UiType,
  turbulenceNoise: number,
) => {
  for (var j = 0; j < ui.touchesWithMouse.length; j++) {
    var touch = ui.touchesWithMouse[j];
    if (touch.index < 2 || touch.index > Mouthbook.n) continue;
    if (touch.diameter <= 0) continue;
    var intensity = touch.fricativeIntensity;
    if (intensity == 0) continue;
    addTurbulenceNoiseAtIndex(
      tract,
      glottis,
      0.66 * turbulenceNoise * intensity,
      touch.index,
      touch.diameter,
    );
  }
};

export const addTurbulenceNoiseAtIndex = (
  tract: TractType,
  glottis: Throat,
  turbulenceNoise: number,
  index: number,
  diameter: number,
) => {
  const i = Math.floor(index);
  const delta = index - i;
  turbulenceNoise *= getNoiseModulator(glottis);
  const thinness0 = clamp(8 * (0.7 - diameter), 0, 1);
  const openness = clamp(30 * (diameter - 0.3), 0, 1);
  const noise0 = turbulenceNoise * (1 - delta) * thinness0 * openness;
  const noise1 = turbulenceNoise * delta * thinness0 * openness;
  if (i + 1 < tract.main.length) {
    tract.main[i + 1].left += noise0 / 2;
    tract.main[i + 1].right += noise0 / 2;
  }
  if (i + 2 < tract.main.length) {
    tract.main[i + 2].left += noise1 / 2;
    tract.main[i + 2].right += noise1 / 2;
  }
};

export const reshapeTract = (tract: TractType, deltaTime: number) => {
  let amount = deltaTime * Settings.speed;
  let newLastObstruction: Maybe<Obstruction> = undefined;
  for (let i = 0; i < Mouthbook.n; i++) {
    const diameter = tract.width[i].now;
    const targetDiameter = tract.width[i].goal;
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
    tract.width[i].now = nudge(
      diameter,
      targetDiameter,
      slowReturn * amount,
      2 * amount,
    );
  }
  if (
    tract.lastObstruction !== undefined &&
    newLastObstruction === undefined &&
    tract.nose.area[0] < 0.05
  ) {
    tract.transients.push(makeTransient(tract.lastObstruction));
  }
  tract.lastObstruction = newLastObstruction;

  amount = deltaTime * Settings.speed;
  tract.nose.width[0] = nudge(
    tract.nose.width[0],
    tract.velumTarget,
    amount * 0.25,
    amount * 0.1,
  );
  tract.nose.area[0] = tract.nose.width[0] ** 2;
};

export const runTractStep = (
  tract: TractType,
  glottis: Throat,
  audioSystem: Snail,
  ui: UiType,
  glottalOutput: number,
  turbulenceNoise: number,
  lambda: number,
) => {
  var updateAmplitudes = Math.random() < 0.1;

  //mouth
  processTransients(tract, audioSystem);
  addTurbulenceNoise(tract, glottis, ui, turbulenceNoise);

  tract.junctionOutput[0].right =
    tract.main[0].left * Fastenings.reflection.glottal + glottalOutput;
  tract.junctionOutput[Mouthbook.n].left =
    tract.main[Mouthbook.n - 1].right * Fastenings.reflection.lip;

  for (var i = 1; i < Mouthbook.n; i++) {
    var r = tract.bend[i].old * (1 - lambda) + tract.bend[i].niw * lambda;
    var w = r * (tract.main[i - 1].right + tract.main[i].left);
    tract.junctionOutput[i].right = tract.main[i - 1].right - w;
    tract.junctionOutput[i].left = tract.main[i].left + w;
  }

  //now at junction with nose
  var j = Mouthbook.noseStart;
  var r =
    tract.newReflectionLeft * (1 - lambda) + tract.reflectionLeft * lambda;
  tract.junctionOutput[j].left =
    r * tract.main[j - 1].right +
    (1 + r) * (tract.nose.main[0].left + tract.main[j].left);
  r = tract.newReflectionRight * (1 - lambda) + tract.reflectionRight * lambda;
  tract.junctionOutput[j].right =
    r * tract.main[j].left +
    (1 + r) * (tract.main[j - 1].right + tract.nose.main[0].left);
  r = tract.newReflectionNose * (1 - lambda) + tract.reflectionNose * lambda;
  tract.nose.junctionOutput[0].right =
    r * tract.nose.main[0].left +
    (1 + r) * (tract.main[j].left + tract.main[j - 1].right);

  for (var i = 0; i < Mouthbook.n; i++) {
    tract.main[i].right = tract.junctionOutput[i].right * 0.999;
    tract.main[i].left = tract.junctionOutput[i + 1].left * 0.999;

    if (updateAmplitudes) {
      var amplitude = Math.abs(tract.main[i].right + tract.main[i].left);
      if (amplitude > tract.maxAmplitude[i]) tract.maxAmplitude[i] = amplitude;
      else tract.maxAmplitude[i] *= 0.999;
    }
  }

  tract.lipOutput = tract.main[Mouthbook.n - 1].right;

  //nose
  tract.nose.junctionOutput[Mouthbook.noseLength].left =
    tract.nose.main[Mouthbook.noseLength - 1].right * Fastenings.reflection.lip;

  for (var i = 1; i < Mouthbook.noseLength; i++) {
    var w =
      tract.nose.bend[i] *
      (tract.nose.main[i - 1].right + tract.nose.main[i].left);
    tract.nose.junctionOutput[i].right = tract.nose.main[i - 1].right - w;
    tract.nose.junctionOutput[i].left = tract.nose.main[i].left + w;
  }

  for (var i = 0; i < Mouthbook.noseLength; i++) {
    tract.nose.main[i].right =
      tract.nose.junctionOutput[i].right * Settings.fade;
    tract.nose.main[i].left =
      tract.nose.junctionOutput[i + 1].left * Settings.fade;

    if (updateAmplitudes) {
      var amplitude = Math.abs(
        tract.nose.main[i].right + tract.nose.main[i].left,
      );
      if (amplitude > tract.nose.maxAmplitude[i])
        tract.nose.maxAmplitude[i] = amplitude;
      else tract.nose.maxAmplitude[i] *= 0.999;
    }
  }

  tract.noseOutput = tract.nose.main[Mouthbook.noseLength - 1].right;
};
