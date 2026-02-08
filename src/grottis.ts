import { type Snail } from "./grail";
import { UI } from "./grui";
import { clamp, noiseWith } from "./math";
import { drawKeyboard } from "./glottisUi";
import { Settings } from "./settings";
import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import type { Maybe } from "./type";

export type GlottisType = typeof Glottis;

export type Throat = {
  isTouched: boolean;
  noise: NoiseFunction2D;
};

export const makeThroat = () => {};

export const Glottis = {
  timeInWaveform: 0,
  oldFrequency: 140,
  newFrequency: 140,
  UIFrequency: 140,
  smoothFrequency: 140,
  oldTenseness: 0.6,
  newTenseness: 0.6,
  UITenseness: 0.6,
  totalTime: 0,
  intensity: 0,
  loudness: 1,
  isTouched: false,
  touch: 0,
  x: 240,
  y: 530,
  waveshape: undefined as Maybe<Waveshape>,
  noise: createNoise2D(),
};

export const simplex1 = (x: number) => noiseWith(Glottis.noise, x);

export const initGlottis = (
  glottis: GlottisType,
  backCtx: CanvasRenderingContext2D,
) => {
  setupWaveform(glottis, 0);
  drawKeyboard(backCtx);
};

export const getNoiseModulator = (glottis: GlottisType) => {
  const voiced =
    0.1 +
    0.2 *
      Math.max(
        0,
        Math.sin(
          (Math.PI * 2 * glottis.timeInWaveform) / glottis.waveformLength,
        ),
      );
  return (
    glottis.UITenseness * glottis.intensity * voiced +
    (1 - glottis.UITenseness * glottis.intensity) * 0.3
  );
};

export const handleTouches = (glottis: GlottisType) => {
  if (glottis.touch != 0 && !glottis.touch.alive) {
    glottis.touch = 0;
  }

  if (glottis.touch == 0) {
    for (let j = 0; j < UI.touchesWithMouse.length; j++) {
      const touch = UI.touchesWithMouse[j];
      if (!touch.alive) {
        continue;
      }
      if (touch.y < Settings.ui.glottis.keyboardTop) {
        continue;
      }
      glottis.touch = touch;
    }
  }

  if (glottis.touch != 0) {
    let local_y = glottis.touch.y - Settings.ui.glottis.keyboardTop - 10;
    let local_x = glottis.touch.x - Settings.ui.glottis.keyboardLeft;

    local_y = clamp(local_y, 0, Settings.ui.glottis.keyboardHeight - 26);

    const semitone =
      (Settings.ui.glottis.semitones * local_x) /
        Settings.ui.glottis.keyboardWidth +
      0.5;

    glottis.UIFrequency =
      Settings.ui.glottis.baseNote * Math.pow(2, semitone / 12);

    if (glottis.intensity == 0) glottis.smoothFrequency = glottis.UIFrequency;

    const t = clamp(
      1 - local_y / (Settings.ui.glottis.keyboardHeight - 28),
      0,
      1,
    );

    glottis.UITenseness = 1 - Math.cos(t * Math.PI * 0.5);
    glottis.loudness = Math.pow(glottis.UITenseness, 0.25);

    glottis.x = glottis.touch.x;
    glottis.y = local_y + Settings.ui.glottis.keyboardTop + 10;
  }

  glottis.isTouched = glottis.touch !== 0;
};

export const runGlottisStep = (
  glottis: GlottisType,
  audioSystem: Snail,
  lambda: number,
  noiseSource: number,
) => {
  const timeStep = 1.0 / audioSystem.context.sampleRate;
  glottis.timeInWaveform += timeStep;
  glottis.totalTime += timeStep;

  if (glottis.timeInWaveform > glottis.waveformLength) {
    glottis.timeInWaveform -= glottis.waveformLength;
    setupWaveform(glottis, lambda);
  }

  let out = normalizedLFWaveform(
    glottis,
    glottis.timeInWaveform / glottis.waveformLength,
  );
  let aspiration =
    glottis.intensity *
    (1 - Math.sqrt(glottis.UITenseness)) *
    getNoiseModulator(glottis) *
    noiseSource;
  aspiration *= 0.2 + 0.02 * simplex1(glottis.totalTime * 1.99);
  out += aspiration;

  return out;
};

export const finishGlottisBlock = (glottis: GlottisType) => {
  let vibrato = 0;
  vibrato +=
    Settings.vibrato.amount *
    Math.sin(2 * Math.PI * glottis.totalTime * Settings.vibrato.frequency);
  vibrato += 0.02 * simplex1(glottis.totalTime * 4.07);
  vibrato += 0.04 * simplex1(glottis.totalTime * 2.15);
  if (UI.autoWobble) {
    vibrato += 0.2 * simplex1(glottis.totalTime * 0.98);
    vibrato += 0.4 * simplex1(glottis.totalTime * 0.5);
  }

  if (glottis.UIFrequency > glottis.smoothFrequency)
    glottis.smoothFrequency = Math.min(
      glottis.smoothFrequency * 1.1,
      glottis.UIFrequency,
    );
  if (glottis.UIFrequency < glottis.smoothFrequency)
    glottis.smoothFrequency = Math.max(
      glottis.smoothFrequency / 1.1,
      glottis.UIFrequency,
    );
  glottis.oldFrequency = glottis.newFrequency;
  glottis.newFrequency = glottis.smoothFrequency * (1 + vibrato);
  glottis.oldTenseness = glottis.newTenseness;
  glottis.newTenseness =
    glottis.UITenseness +
    0.1 * simplex1(glottis.totalTime * 0.46) +
    0.05 * simplex1(glottis.totalTime * 0.36);
  if (!glottis.isTouched && UI.alwaysVoice)
    glottis.newTenseness += (3 - glottis.UITenseness) * (1 - glottis.intensity);

  if (glottis.isTouched || UI.alwaysVoice) glottis.intensity += 0.13;
  else glottis.intensity -= 0.05;
  glottis.intensity = clamp(glottis.intensity, 0, 1);
};

type Waveshape = {
  Rd: number;
  alpha: number;
  E0: number;
  epsilon: number;
  shift: number;
  Delta: number;
  Te: number;
  omega: number;
};

export const setupWaveform = (glottis: GlottisType, lambda: number) => {
  glottis.frequency =
    glottis.oldFrequency * (1 - lambda) + glottis.newFrequency * lambda;
  var tenseness =
    glottis.oldTenseness * (1 - lambda) + glottis.newTenseness * lambda;
  glottis.Rd = 3 * (1 - tenseness);
  glottis.waveformLength = 1.0 / glottis.frequency;

  var Rd = glottis.Rd;
  if (Rd < 0.5) Rd = 0.5;
  if (Rd > 2.7) Rd = 2.7;
  // normalized to time = 1, Ee = 1
  var Ra = -0.01 + 0.048 * Rd;
  var Rk = 0.224 + 0.118 * Rd;
  var Rg = ((Rk / 4) * (0.5 + 1.2 * Rk)) / (0.11 * Rd - Ra * (0.5 + 1.2 * Rk));

  var Ta = Ra;
  var Tp = 1 / (2 * Rg);
  var Te = Tp + Tp * Rk; //

  var epsilon = 1 / Ta;
  var shift = Math.exp(-epsilon * (1 - Te));
  var Delta = 1 - shift; //divide by glottis to scale RHS

  var RHSIntegral = (1 / epsilon) * (shift - 1) + (1 - Te) * shift;
  RHSIntegral = RHSIntegral / Delta;

  var totalLowerIntegral = -(Te - Tp) / 2 + RHSIntegral;
  var totalUpperIntegral = -totalLowerIntegral;

  var omega = Math.PI / Tp;
  var s = Math.sin(omega * Te);
  // need E0*e^(alpha*Te)*s = -1 (to meet the return at -1)
  // and E0*e^(alpha*Tp/2) * Tp*2/pi = totalUpperIntegral
  //             (our approximation of the integral up to Tp)
  // writing x for e^alpha,
  // have E0*x^Te*s = -1 and E0 * x^(Tp/2) * Tp*2/pi = totalUpperIntegral
  // dividing the second by the first,
  // letting y = x^(Tp/2 - Te),
  // y * Tp*2 / (pi*s) = -totalUpperIntegral;
  var y = (-Math.PI * s * totalUpperIntegral) / (Tp * 2);
  var z = Math.log(y);
  var alpha = z / (Tp / 2 - Te);
  var E0 = -1 / (s * Math.exp(alpha * Te));
  glottis.alpha = alpha;
  glottis.E0 = E0;
  glottis.epsilon = epsilon;
  glottis.shift = shift;
  glottis.Delta = Delta;
  glottis.Te = Te;
  glottis.omega = omega;
};

export const normalizedLFWaveform = (glottis: GlottisType, t: number) => {
  const output =
    t > glottis.Te
      ? (-Math.exp(-glottis.epsilon * (t - glottis.Te)) + glottis.shift) /
        glottis.Delta
      : glottis.E0 * Math.exp(glottis.alpha * t) * Math.sin(glottis.omega * t);

  return output * glottis.intensity * glottis.loudness;
};
