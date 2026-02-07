import { AudioSystem } from "./snail";
import { Glottis } from "./grottis";
import { UI } from "./grui";
import { nudge, clamp } from "./math";
import type { Upto } from "./rime";
import { Fastenings, Settings } from "./settings";

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

export const processTransients = (tract: TractType) => {
  for (var i = 0; i < tract.transients.length; i++) {
    var trans = tract.transients[i];
    var amplitude =
      trans.strength * Math.pow(2, -trans.exponent * trans.timeAlive);
    tract.R[trans.position] += amplitude / 2;
    tract.L[trans.position] += amplitude / 2;
    trans.timeAlive += 1.0 / (AudioSystem.sampleRate * 2);
  }
  for (var i = tract.transients.length - 1; i >= 0; i--) {
    var trans = tract.transients[i];
    if (trans.timeAlive > trans.lifeTime) {
      tract.transients.splice(i, 1);
    }
  }
};

export const finishTractBlock = (tract: TractType) => {
  reshapeTract(tract, AudioSystem.blockTime);
  calculateReflections(tract);
};

export const calculateReflections = (tract: TractType) => {
  for (var i = 0; i < tract.n; i++) {
    tract.A[i] = tract.diameter[i] * tract.diameter[i]; //ignoring PI etc.
  }
  for (var i = 1; i < tract.n; i++) {
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
    tract.A[tract.noseStart] + tract.A[tract.noseStart + 1] + tract.noseA[0];
  tract.newReflectionLeft = (2 * tract.A[tract.noseStart] - sum) / sum;
  tract.newReflectionRight = (2 * tract.A[tract.noseStart + 1] - sum) / sum;
  tract.newReflectionNose = (2 * tract.noseA[0] - sum) / sum;
};

export const calculateNoseReflections = (tract: TractType) => {
  for (var i = 0; i < tract.noseLength; i++) {
    tract.noseA[i] = tract.noseDiameter[i] * tract.noseDiameter[i];
  }
  for (var i = 1; i < tract.noseLength; i++) {
    tract.noseReflection[i] =
      (tract.noseA[i - 1] - tract.noseA[i]) /
      (tract.noseA[i - 1] + tract.noseA[i]);
  }
};

export const addTurbulenceNoise = (
  tract: TractType,
  turbulenceNoise: number,
) => {
  for (var j = 0; j < UI.touchesWithMouse.length; j++) {
    var touch = UI.touchesWithMouse[j];
    if (touch.index < 2 || touch.index > Tract.n) continue;
    if (touch.diameter <= 0) continue;
    var intensity = touch.fricative_intensity;
    if (intensity == 0) continue;
    addTurbulenceNoiseAtIndex(
      tract,
      0.66 * turbulenceNoise * intensity,
      touch.index,
      touch.diameter,
    );
  }
};

export const addTurbulenceNoiseAtIndex = (
  tract: TractType,
  turbulenceNoise: number,
  index: number,
  diameter: number,
) => {
  var i = Math.floor(index);
  var delta = index - i;
  turbulenceNoise *= Glottis.getNoiseModulator();
  var thinness0 = clamp(8 * (0.7 - diameter), 0, 1);
  var openness = clamp(30 * (diameter - 0.3), 0, 1);
  var noise0 = turbulenceNoise * (1 - delta) * thinness0 * openness;
  var noise1 = turbulenceNoise * delta * thinness0 * openness;
  tract.R[i + 1] += noise0 / 2;
  tract.L[i + 1] += noise0 / 2;
  tract.R[i + 2] += noise1 / 2;
  tract.L[i + 2] += noise1 / 2;
};

export const reshapeTract = (tract: TractType, deltaTime: number) => {
  var amount = deltaTime * Settings.speed;
  var newLastObstruction = -1;
  for (var i = 0; i < tract.n; i++) {
    var diameter = tract.diameter[i];
    var targetDiameter = tract.targetDiameter[i];
    if (diameter <= 0) newLastObstruction = i;
    var slowReturn;
    if (i < tract.noseStart) slowReturn = 0.6;
    else if (i >= tract.tipStart) slowReturn = 1.0;
    else
      slowReturn =
        0.6 +
        (0.4 * (i - tract.noseStart)) / (tract.tipStart - tract.noseStart);
    tract.diameter[i] = nudge(
      diameter,
      targetDiameter,
      slowReturn * amount,
      2 * amount,
    );
  }
  if (
    tract.lastObstruction > -1 &&
    newLastObstruction == -1 &&
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
  tract.noseA[0] = tract.noseDiameter[0] * tract.noseDiameter[0];
};

export const runStep = (
  tract: TractType,
  glottalOutput: number,
  turbulenceNoise: number,
  lambda: number,
) => {
  var updateAmplitudes = Math.random() < 0.1;

  //mouth
  processTransients(tract);
  addTurbulenceNoise(tract, turbulenceNoise);

  tract.junctionOutputR[0] =
    tract.L[0] * Fastenings.reflection.glottal + glottalOutput;
  tract.junctionOutputL[tract.n] =
    tract.R[tract.n - 1] * Fastenings.reflection.lip;

  for (var i = 1; i < tract.n; i++) {
    var r =
      tract.reflection[i] * (1 - lambda) + tract.newReflection[i] * lambda;
    var w = r * (tract.R[i - 1] + tract.L[i]);
    tract.junctionOutputR[i] = tract.R[i - 1] - w;
    tract.junctionOutputL[i] = tract.L[i] + w;
  }

  //now at junction with nose
  var i = tract.noseStart;
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

  for (var i = 0; i < tract.n; i++) {
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

  tract.lipOutput = tract.R[tract.n - 1];

  //nose
  tract.noseJunctionOutputL[tract.noseLength] =
    tract.noseR[tract.noseLength - 1] * Fastenings.reflection.lip;

  for (var i = 1; i < tract.noseLength; i++) {
    var w = tract.noseReflection[i] * (tract.noseR[i - 1] + tract.noseL[i]);
    tract.noseJunctionOutputR[i] = tract.noseR[i - 1] - w;
    tract.noseJunctionOutputL[i] = tract.noseL[i] + w;
  }

  for (var i = 0; i < tract.noseLength; i++) {
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

  tract.noseOutput = tract.noseR[tract.noseLength - 1];
};

export var Tract = {
  n: 44,
  bladeStart: 10,
  tipStart: 32,
  lipStart: 39,
  R: [], //component going right
  L: [], //component going left
  reflection: [],
  junctionOutputR: [],
  junctionOutputL: [],
  maxAmplitude: [],
  diameter: [],
  restDiameter: [],
  targetDiameter: [],
  newDiameter: [],
  A: [],
  lastObstruction: -1,
  fade: 1.0, //0.9999,
  transients: [] as Transient[],
  lipOutput: 0,
  noseOutput: 0,
  velumTarget: 0.01,

  init: function () {
    this.bladeStart = Math.floor((this.bladeStart * this.n) / 44);
    this.tipStart = Math.floor((this.tipStart * this.n) / 44);
    this.lipStart = Math.floor((this.lipStart * this.n) / 44);
    this.diameter = new Float64Array(this.n);
    this.restDiameter = new Float64Array(this.n);
    this.targetDiameter = new Float64Array(this.n);
    this.newDiameter = new Float64Array(this.n);
    for (var i = 0; i < this.n; i++) {
      var diameter = 0;
      if (i < (7 * this.n) / 44 - 0.5) diameter = 0.6;
      else if (i < (12 * this.n) / 44) diameter = 1.1;
      else diameter = 1.5;
      this.diameter[i] =
        this.restDiameter[i] =
        this.targetDiameter[i] =
        this.newDiameter[i] =
          diameter;
    }
    this.R = new Float64Array(this.n);
    this.L = new Float64Array(this.n);
    this.reflection = new Float64Array(this.n + 1);
    this.newReflection = new Float64Array(this.n + 1);
    this.junctionOutputR = new Float64Array(this.n + 1);
    this.junctionOutputL = new Float64Array(this.n + 1);
    this.A = new Float64Array(this.n);
    this.maxAmplitude = new Float64Array(this.n);

    this.noseLength = Math.floor((28 * this.n) / 44);
    this.noseStart = this.n - this.noseLength + 1;
    this.noseR = new Float64Array(this.noseLength);
    this.noseL = new Float64Array(this.noseLength);
    this.noseJunctionOutputR = new Float64Array(this.noseLength + 1);
    this.noseJunctionOutputL = new Float64Array(this.noseLength + 1);
    this.noseReflection = new Float64Array(this.noseLength + 1);
    this.noseDiameter = new Float64Array(this.noseLength);
    this.noseA = new Float64Array(this.noseLength);
    this.noseMaxAmplitude = new Float64Array(this.noseLength);
    for (var i = 0; i < this.noseLength; i++) {
      var diameter;
      var d = 2 * (i / this.noseLength);
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
