import { type Snail } from "./grail";
import { UI } from "./grui";
import { clamp, noiseWith, type Z } from "./math";
import { drawKeyboard } from "./glottisUi";
import { Settings } from "./settings";
import { createNoise2D, type NoiseFunction2D } from "simplex-noise";
import type { Maybe } from "./type";

export type GlottisType<W extends Maybe<Wave> = Maybe<Wave>> =
  typeof Glottis & { wave: W };

export interface Throat<W extends Maybe<Wave> = Maybe<Wave>> {
  timeInWaveform: number;
  totalTime: number;

  frequency: Record<"old" | "niw" | "ui" | "smooth", number>;
  tenseness: Record<"old" | "niw" | "ui", number>;

  intensity: number;
  loudness: number;

  isTouched: boolean;
  touch: Maybe<Touche>;
  z: Z;

  wave: W;
  noise: NoiseFunction2D;
}

type Touche = Z & { isAlive: boolean };

export const makeThroat = (): Throat => {
  return {
    timeInWaveform: 0,
    totalTime: 0,

    frequency: {
      old: 140,
      niw: 140,
      ui: 140,
      smooth: 140,
    },

    tenseness: {
      old: 0.6,
      niw: 0.6,
      ui: 0.6,
    },

    intensity: 0,
    loudness: 1,

    isTouched: false,
    touch: undefined,
    z: { x: 240, y: 530 },

    wave: undefined,
    noise: createNoise2D(),
  };
};

export const Glottis = {
  timeInWaveform: 0,
  totalTime: 0,

  oldFrequency: 140,
  newFrequency: 140,
  UIFrequency: 140,
  smoothFrequency: 140,

  oldTenseness: 0.6,
  newTenseness: 0.6,
  UITenseness: 0.6,

  intensity: 0,
  loudness: 1,

  isTouched: false,
  touch: undefined as Maybe<Touche>,
  z: { x: 240, y: 530 },

  wave: undefined as Maybe<Wave>,
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

export const getNoiseModulator = <W extends Wave>(glottis: GlottisType<W>) => {
  const voiced =
    0.1 +
    0.2 *
      Math.max(
        0,
        Math.sin(
          (Math.PI * 2 * glottis.timeInWaveform) / glottis.wave.waveformLength,
        ),
      );
  return (
    glottis.UITenseness * glottis.intensity * voiced +
    (1 - glottis.UITenseness * glottis.intensity) * 0.3
  );
};

export const handleTouches = (glottis: GlottisType) => {
  if (glottis.touch !== undefined && !glottis.touch.isAlive) {
    glottis.touch = undefined;
  }

  if (glottis.touch === undefined) {
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

  if (glottis.touch !== undefined) {
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

    glottis.z.x = glottis.touch.x;
    glottis.z.y = local_y + Settings.ui.glottis.keyboardTop + 10;
  }

  glottis.isTouched = glottis.touch !== undefined;
};

export const runGlottisStep = <W extends Wave>(
  glottis: GlottisType<W>,
  audioSystem: Snail,
  lambda: number,
  noiseSource: number,
) => {
  const timeStep = 1.0 / audioSystem.context.sampleRate;
  glottis.timeInWaveform += timeStep;
  glottis.totalTime += timeStep;

  if (glottis.timeInWaveform > glottis.wave!.waveformLength) {
    glottis.timeInWaveform -= glottis.wave!.waveformLength;
    setupWaveform(glottis, lambda);
  }

  let out = normalizedLFWaveform(
    glottis,
    glottis.timeInWaveform / glottis.wave!.waveformLength,
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

export type Wave = {
  Rd: number;
  alpha: number;
  E0: number;
  epsilon: number;
  shift: number;
  Delta: number;
  Te: number;
  omega: number;
  frequency: number;
  waveformLength: number;
};

export const setupWaveform = (glottis: GlottisType, lambda: number) => {
  const frequency =
    glottis.oldFrequency * (1 - lambda) + glottis.newFrequency * lambda;
  const tenseness =
    glottis.oldTenseness * (1 - lambda) + glottis.newTenseness * lambda;
  const waveformLength = 1.0 / frequency;

  let Rd = 3 * (1 - tenseness);
  if (Rd < 0.5) Rd = 0.5;
  if (Rd > 2.7) Rd = 2.7;
  // normalized to time = 1, Ee = 1
  const Ra = -0.01 + 0.048 * Rd;
  const Rk = 0.224 + 0.118 * Rd;
  const Rg =
    ((Rk / 4) * (0.5 + 1.2 * Rk)) / (0.11 * Rd - Ra * (0.5 + 1.2 * Rk));

  const Ta = Ra;
  const Tp = 1 / (2 * Rg);
  const Te = Tp + Tp * Rk; //

  const epsilon = 1 / Ta;
  const shift = Math.exp(-epsilon * (1 - Te));
  const Delta = 1 - shift; //divide by glottis to scale RHS

  let RHSIntegral = (1 / epsilon) * (shift - 1) + (1 - Te) * shift;
  RHSIntegral = RHSIntegral / Delta;

  const totalLowerIntegral = -(Te - Tp) / 2 + RHSIntegral;
  const totalUpperIntegral = -totalLowerIntegral;

  const omega = Math.PI / Tp;
  const s = Math.sin(omega * Te);
  // need E0*e^(alpha*Te)*s = -1 (to meet the return at -1)
  // and E0*e^(alpha*Tp/2) * Tp*2/pi = totalUpperIntegral
  //             (our approximation of the integral up to Tp)
  // writing x for e^alpha,
  // have E0*x^Te*s = -1 and E0 * x^(Tp/2) * Tp*2/pi = totalUpperIntegral
  // dividing the second by the first,
  // letting y = x^(Tp/2 - Te),
  // y * Tp*2 / (pi*s) = -totalUpperIntegral;
  const y = (-Math.PI * s * totalUpperIntegral) / (Tp * 2);
  const z = Math.log(y);
  const alpha = z / (Tp / 2 - Te);
  const E0 = -1 / (s * Math.exp(alpha * Te));

  glottis.wave = {
    Rd,
    alpha,
    E0,
    epsilon,
    shift,
    Delta,
    Te,
    omega,
    frequency,
    waveformLength,
  };
};

export const normalizedLFWaveform = <W extends Wave>(
  glottis: GlottisType<W>,
  t: number,
) => {
  const output =
    t > glottis.wave.Te
      ? (-Math.exp(-glottis.wave.epsilon * (t - glottis.wave.Te)) +
          glottis.wave.shift) /
        glottis.wave.Delta
      : glottis.wave.E0 *
        Math.exp(glottis.wave.alpha * t) *
        Math.sin(glottis.wave.omega * t);

  return output * glottis.intensity * glottis.loudness;
};
