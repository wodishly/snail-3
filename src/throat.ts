import { type Snail } from "./snail";
import { clamp, type Z } from "./help/math";
import { Settings } from "./settings";
import { createNoise2D } from "simplex-noise";
import type { Maybe } from "./help/type";
import { normalizedLFWaveform, setupWaveform, type Wave } from "./wave";
import type { Flesh } from "./flesh";
import type { Rine } from "./rine";

export type Frequency = Record<"old" | "niw" | "ui" | "smooth", number>;
export type Tenseness = Record<"old" | "niw" | "ui", number>;

export interface Throat {
  timeInWaveform: number;
  totalTime: number;

  frequency: Frequency;
  tenseness: Tenseness;

  intensity: number;
  loudness: number;

  isTouched: boolean;
  rine: Maybe<Rine>;
  pitchZ: Z;

  wave: Wave;
  hiss: (x: number) => number;
}

const makeHiss = () => {
  const noise = createNoise2D();
  return (x: number) => {
    return noise(x * 1.2, -x * 0.7);
  };
};

export const makeThroat = (): Throat => {
  const frequency = {
    old: 140,
    niw: 140,
    ui: 140,
    smooth: 140,
  };

  const tenseness = {
    old: 0.6,
    niw: 0.6,
    ui: 0.6,
  };

  return {
    timeInWaveform: 0,
    totalTime: 0,

    frequency,
    tenseness,

    intensity: 0,
    loudness: 1,

    isTouched: false,
    rine: undefined,
    pitchZ: { x: 240, y: 530 },

    wave: setupWaveform(frequency, tenseness, 0),
    hiss: makeHiss(),
  };
};

export const getNoiseModulator = (throat: Throat) => {
  const voiced =
    0.1 +
    0.2 *
      Math.max(
        0,
        Math.sin(
          (Math.PI * 2 * throat.timeInWaveform) / throat.wave.waveformLength,
        ),
      );
  return (
    throat.tenseness.ui * throat.intensity * voiced +
    (1 - throat.tenseness.ui * throat.intensity) * 0.3
  );
};

export const setPitch = (throat: Throat, pitch: number, volume = 1) => {
  throat.frequency.ui = pitch;

  if (throat.intensity === 0) {
    throat.frequency.smooth = throat.frequency.ui;
  }

  throat.tenseness.ui = 1 - Math.cos((Math.PI / 2) * volume);
  throat.loudness = Math.pow(throat.tenseness.ui, 0.25);
};

export const runGlottisStep = (
  throat: Throat,
  snail: Snail,
  lambda: number,
  noiseSource: number,
) => {
  const timeStep = 1.0 / snail.context.sampleRate;
  throat.timeInWaveform += timeStep;
  throat.totalTime += timeStep;

  if (throat.timeInWaveform > throat.wave!.waveformLength) {
    throat.timeInWaveform -= throat.wave!.waveformLength;
    throat.wave = setupWaveform(throat.frequency, throat.tenseness, lambda);
  }

  let out = normalizedLFWaveform(
    throat,
    throat.timeInWaveform / throat.wave!.waveformLength,
  );
  let aspiration =
    throat.intensity *
    (1 - Math.sqrt(throat.tenseness.ui)) *
    getNoiseModulator(throat) *
    noiseSource;
  aspiration *= 0.2 + 0.02 * throat.hiss(throat.totalTime * 1.99);
  out += aspiration;

  return out;
};

export const finishGlottisBlock = (glottis: Throat, ui: Flesh) => {
  let vibrato = 0;
  vibrato +=
    Settings.vibrato.amount *
    Math.sin(2 * Math.PI * glottis.totalTime * Settings.vibrato.frequency);
  vibrato += 0.02 * glottis.hiss(glottis.totalTime * 4.07);
  vibrato += 0.04 * glottis.hiss(glottis.totalTime * 2.15);

  if (ui.isAutoWobbling) {
    vibrato += 0.2 * glottis.hiss(glottis.totalTime * 0.98);
    vibrato += 0.4 * glottis.hiss(glottis.totalTime * 0.5);
  }

  if (glottis.frequency.ui > glottis.frequency.smooth) {
    glottis.frequency.smooth = Math.min(
      glottis.frequency.smooth * 1.1,
      glottis.frequency.ui,
    );
  }

  if (glottis.frequency.ui < glottis.frequency.smooth) {
    glottis.frequency.smooth = Math.max(
      glottis.frequency.smooth / 1.1,
      glottis.frequency.ui,
    );
  }

  glottis.frequency.old = glottis.frequency.niw;
  glottis.frequency.niw = glottis.frequency.smooth * (1 + vibrato);
  glottis.tenseness.old = glottis.tenseness.niw;
  glottis.tenseness.niw =
    glottis.tenseness.ui +
    0.1 * glottis.hiss(glottis.totalTime * 0.46) +
    0.05 * glottis.hiss(glottis.totalTime * 0.36);

  if (!glottis.isTouched && ui.isAlwaysVoicing) {
    glottis.tenseness.niw +=
      (3 - glottis.tenseness.ui) * (1 - glottis.intensity);
  }

  if (glottis.isTouched || ui.isAlwaysVoicing) {
    glottis.intensity += 0.13;
  } else {
    glottis.intensity -= 0.05;
  }

  glottis.intensity = clamp(glottis.intensity, 0, 1);
};
