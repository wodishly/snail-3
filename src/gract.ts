import { reckonBlockTime, type Snail } from "./grail";
import { getNoiseModulator, type Throat } from "./grottis";
import { UI } from "./grui";
import { nudge, clamp } from "./math";
import type { Upto } from "./rime";
import { Fastenings, Mouthbook, Settings } from "./settings";

export type TractType = typeof Tract;

type Dealtell = Upto<44>;

type Transient = {
  position: Dealtell;
  timeAlive: number;
  lifeTime: number;
  strength: number;
  exponent: number;
};

export const makeTransient = (position: Dealtell): Transient => {
  return {
    position,
    timeAlive: 0,
    lifeTime: 0.2,
    strength: 0.3,
    exponent: 200,
  };
};

export const processTransients = (tract: TractType, audioSystem: Snail) => {
  for (let i = 0; i < tract.transients.length; i++) {
    const transient = tract.transients[i];
    const amplitude =
      transient.strength *
      Math.pow(2, -transient.exponent * transient.timeAlive);
    tract.R[transient.position] += amplitude / 2;
    tract.L[transient.position] += amplitude / 2;
    transient.timeAlive += 1 / (audioSystem.context.sampleRate * 2);
  }

  for (let i = tract.transients.length - 1; i >= 0; i--) {
    const transient = tract.transients[i];
    if (transient.timeAlive > transient.lifeTime) {
      tract.transients.splice(i, 1);
    }
  }
};

export const finishTractBlock = (tract: TractType, audioSystem: Snail) => {
  reshapeTract(tract, reckonBlockTime(audioSystem));
  calculateReflections(tract);
};

export const calculateReflections = (tract: TractType) => {
  for (var i = 0; i < Mouthbook.n; i++) {
    tract.A[i] = tract.diameter[i] * tract.diameter[i]; //ignoring PI etc.
  }
  for (var i = 1; i < Mouthbook.n; i++) {
    tract.reflection[i] = tract.newReflection[i];
    if (tract.A[i] == 0)
      tract.newReflection[i] = 0.999; //to prevent some bad behaviour if 0
    else
      tract.newReflection[i] =
        (tract.A[i - 1] - tract.A[i]) / (tract.A[i - 1] + tract.A[i]);
  }

  //now at junction with nose

  tract.reflectionLeft = tract.newReflectionLeft;
  tract.reflectionRight = tract.newReflectionRight;
  tract.reflectionNose = tract.newReflectionNose;
  var sum =
    tract.A[Mouthbook.noseStart] +
    tract.A[Mouthbook.noseStart + 1] +
    tract.noseA[0];
  tract.newReflectionLeft = (2 * tract.A[Mouthbook.noseStart] - sum) / sum;
  tract.newReflectionRight = (2 * tract.A[Mouthbook.noseStart + 1] - sum) / sum;
  tract.newReflectionNose = (2 * tract.noseA[0] - sum) / sum;
};

export const calculateNoseReflections = (tract: TractType) => {
  for (var i = 0; i < Mouthbook.noseLength; i++) {
    tract.noseA[i] = tract.noseDiameter[i] * tract.noseDiameter[i];
  }
  for (var i = 1; i < Mouthbook.noseLength; i++) {
    tract.noseReflection[i] =
      (tract.noseA[i - 1] - tract.noseA[i]) /
      (tract.noseA[i - 1] + tract.noseA[i]);
  }
};

export const addTurbulenceNoise = (
  tract: TractType,
  glottis: Throat,
  turbulenceNoise: number,
) => {
  for (var j = 0; j < UI.touchesWithMouse.length; j++) {
    var touch = UI.touchesWithMouse[j];
    if (touch.index < 2 || touch.index > Mouthbook.n) continue;
    if (touch.diameter <= 0) continue;
    var intensity = touch.fricative_intensity;
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
  tract.R[i + 1] += noise0 / 2;
  tract.L[i + 1] += noise0 / 2;
  tract.R[i + 2] += noise1 / 2;
  tract.L[i + 2] += noise1 / 2;
};

export const reshapeTract = (tract: TractType, deltaTime: number) => {
  let amount = deltaTime * Settings.speed;
  let newLastObstruction = -1;
  for (let i = 0; i < Mouthbook.n; i++) {
    const diameter = tract.diameter[i];
    const targetDiameter = tract.targetDiameter[i];
    if (diameter <= 0) newLastObstruction = i;
    const slowReturn =
      i < Mouthbook.noseStart
        ? 0.6
        : i >= Mouthbook.tipStart
          ? 1.0
          : 0.6 +
            (0.4 * (i - Mouthbook.noseStart)) /
              (Mouthbook.tipStart - Mouthbook.noseStart);
    tract.diameter[i] = nudge(
      diameter,
      targetDiameter,
      slowReturn * amount,
      2 * amount,
    );
  }
  if (
    tract.lastObstruction > -1 &&
    newLastObstruction === -1 &&
    tract.noseA[0] < 0.05
  ) {
    tract.transients.push(makeTransient(tract.lastObstruction));
  }
  tract.lastObstruction = newLastObstruction;

  amount = deltaTime * Settings.speed;
  tract.noseDiameter[0] = nudge(
    tract.noseDiameter[0],
    tract.velumTarget,
    amount * 0.25,
    amount * 0.1,
  );
  tract.noseA[0] = tract.noseDiameter[0] ** 2;
};

export const runTractStep = (
  tract: TractType,
  glottis: Throat,
  audioSystem: Snail,
  glottalOutput: number,
  turbulenceNoise: number,
  lambda: number,
) => {
  var updateAmplitudes = Math.random() < 0.1;

  //mouth
  processTransients(tract, audioSystem);
  addTurbulenceNoise(tract, glottis, turbulenceNoise);

  tract.junctionOutputR[0] =
    tract.L[0] * Fastenings.reflection.glottal + glottalOutput;
  tract.junctionOutputL[Mouthbook.n] =
    tract.R[Mouthbook.n - 1] * Fastenings.reflection.lip;

  for (var i = 1; i < Mouthbook.n; i++) {
    var r =
      tract.reflection[i] * (1 - lambda) + tract.newReflection[i] * lambda;
    var w = r * (tract.R[i - 1] + tract.L[i]);
    tract.junctionOutputR[i] = tract.R[i - 1] - w;
    tract.junctionOutputL[i] = tract.L[i] + w;
  }

  //now at junction with nose
  var i = Mouthbook.noseStart;
  var r =
    tract.newReflectionLeft * (1 - lambda) + tract.reflectionLeft * lambda;
  tract.junctionOutputL[i] =
    r * tract.R[i - 1] + (1 + r) * (tract.noseL[0] + tract.L[i]);
  r = tract.newReflectionRight * (1 - lambda) + tract.reflectionRight * lambda;
  tract.junctionOutputR[i] =
    r * tract.L[i] + (1 + r) * (tract.R[i - 1] + tract.noseL[0]);
  r = tract.newReflectionNose * (1 - lambda) + tract.reflectionNose * lambda;
  tract.noseJunctionOutputR[0] =
    r * tract.noseL[0] + (1 + r) * (tract.L[i] + tract.R[i - 1]);

  for (var i = 0; i < Mouthbook.n; i++) {
    tract.R[i] = tract.junctionOutputR[i] * 0.999;
    tract.L[i] = tract.junctionOutputL[i + 1] * 0.999;

    //tract.R[i] = clamp(tract.junctionOutputR[i] * tract.fade, -1, 1);
    //tract.L[i] = clamp(tract.junctionOutputL[i+1] * tract.fade, -1, 1);

    if (updateAmplitudes) {
      var amplitude = Math.abs(tract.R[i] + tract.L[i]);
      if (amplitude > tract.maxAmplitude[i]) tract.maxAmplitude[i] = amplitude;
      else tract.maxAmplitude[i] *= 0.999;
    }
  }

  tract.lipOutput = tract.R[Mouthbook.n - 1];

  //nose
  tract.noseJunctionOutputL[Mouthbook.noseLength] =
    tract.noseR[Mouthbook.noseLength - 1] * Fastenings.reflection.lip;

  for (var i = 1; i < Mouthbook.noseLength; i++) {
    var w = tract.noseReflection[i] * (tract.noseR[i - 1] + tract.noseL[i]);
    tract.noseJunctionOutputR[i] = tract.noseR[i - 1] - w;
    tract.noseJunctionOutputL[i] = tract.noseL[i] + w;
  }

  for (var i = 0; i < Mouthbook.noseLength; i++) {
    tract.noseR[i] = tract.noseJunctionOutputR[i] * tract.fade;
    tract.noseL[i] = tract.noseJunctionOutputL[i + 1] * tract.fade;

    //tract.noseR[i] = clamp(tract.noseJunctionOutputR[i] * tract.fade, -1, 1);
    //tract.noseL[i] = clamp(tract.noseJunctionOutputL[i+1] * tract.fade, -1, 1);

    if (updateAmplitudes) {
      var amplitude = Math.abs(tract.noseR[i] + tract.noseL[i]);
      if (amplitude > tract.noseMaxAmplitude[i])
        tract.noseMaxAmplitude[i] = amplitude;
      else tract.noseMaxAmplitude[i] *= 0.999;
    }
  }

  tract.noseOutput = tract.noseR[Mouthbook.noseLength - 1];
};

export var Tract = {
  R: [] as number[], //component going right
  L: [] as number[], //component going left
  reflection: [] as number[],
  junctionOutputR: [] as number[],
  junctionOutputL: [] as number[],
  maxAmplitude: [] as number[],
  diameter: [] as number[],
  restDiameter: [] as number[],
  targetDiameter: [] as number[],
  newDiameter: [] as number[],
  A: [] as number[],
  lastObstruction: -1,
  fade: 1.0, //0.9999,
  transients: [] as Transient[],
  lipOutput: 0,
  noseOutput: 0,
  velumTarget: 0.01,

  init: function () {
    this.diameter = new Float64Array(Mouthbook.n);
    this.restDiameter = new Float64Array(Mouthbook.n);
    this.targetDiameter = new Float64Array(Mouthbook.n);
    this.newDiameter = new Float64Array(Mouthbook.n);
    for (var i = 0; i < Mouthbook.n; i++) {
      var diameter = 0;
      if (i < (7 * Mouthbook.n) / 44 - 0.5) diameter = 0.6;
      else if (i < (12 * Mouthbook.n) / 44) diameter = 1.1;
      else diameter = 1.5;
      this.diameter[i] =
        this.restDiameter[i] =
        this.targetDiameter[i] =
        this.newDiameter[i] =
          diameter;
    }
    this.R = new Float64Array(Mouthbook.n);
    this.L = new Float64Array(Mouthbook.n);
    this.reflection = new Float64Array(Mouthbook.n + 1);
    this.newReflection = new Float64Array(Mouthbook.n + 1);
    this.junctionOutputR = new Float64Array(Mouthbook.n + 1);
    this.junctionOutputL = new Float64Array(Mouthbook.n + 1);
    this.A = new Float64Array(Mouthbook.n);
    this.maxAmplitude = new Float64Array(Mouthbook.n);

    this.noseR = new Float64Array(Mouthbook.noseLength);
    this.noseL = new Float64Array(Mouthbook.noseLength);
    this.noseJunctionOutputR = new Float64Array(Mouthbook.noseLength + 1);
    this.noseJunctionOutputL = new Float64Array(Mouthbook.noseLength + 1);
    this.noseReflection = new Float64Array(Mouthbook.noseLength + 1);
    this.noseDiameter = new Float64Array(Mouthbook.noseLength);
    this.noseA = new Float64Array(Mouthbook.noseLength);
    this.noseMaxAmplitude = new Float64Array(Mouthbook.noseLength);
    for (var i = 0; i < Mouthbook.noseLength; i++) {
      var diameter;
      var d = 2 * (i / Mouthbook.noseLength);
      if (d < 1) diameter = 0.4 + 1.6 * d;
      else diameter = 0.5 + 1.5 * (2 - d);
      diameter = Math.min(diameter, 1.9);
      this.noseDiameter[i] = diameter;
    }
    this.newReflectionLeft =
      this.newReflectionRight =
      this.newReflectionNose =
        0;
    calculateReflections(this);
    calculateNoseReflections(this);
    this.noseDiameter[0] = this.velumTarget;
  },
};
