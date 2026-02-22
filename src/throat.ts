import { type Snail } from "./snail";
import { clamp } from "./help/math";
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

  rine: Maybe<Rine>;

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

    rine: undefined,

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

export const finishGlottisBlock = (throat: Throat, flesh: Flesh) => {
  let vibrato = 0;
  vibrato +=
    Settings.vibrato.amount *
    Math.sin(2 * Math.PI * throat.totalTime * Settings.vibrato.frequency);
  vibrato += 0.02 * throat.hiss(throat.totalTime * 4.07);
  vibrato += 0.04 * throat.hiss(throat.totalTime * 2.15);

  if (flesh.isAutoWobbling) {
    vibrato += 0.2 * throat.hiss(throat.totalTime * 0.98);
    vibrato += 0.4 * throat.hiss(throat.totalTime * 0.5);
  }

  if (throat.frequency.ui > throat.frequency.smooth) {
    throat.frequency.smooth = Math.min(
      throat.frequency.smooth * 1.1,
      throat.frequency.ui,
    );
  }

  if (throat.frequency.ui < throat.frequency.smooth) {
    throat.frequency.smooth = Math.max(
      throat.frequency.smooth / 1.1,
      throat.frequency.ui,
    );
  }

  throat.frequency.old = throat.frequency.niw;
  throat.frequency.niw = throat.frequency.smooth * (1 + vibrato);
  throat.tenseness.old = throat.tenseness.niw;
  throat.tenseness.niw =
    throat.tenseness.ui +
    0.1 * throat.hiss(throat.totalTime * 0.46) +
    0.05 * throat.hiss(throat.totalTime * 0.36);

  if (flesh.isAlwaysVoicing) {
    throat.tenseness.niw += (3 - throat.tenseness.ui) * (1 - throat.intensity);
    throat.intensity += 0.13;
  } else {
    throat.intensity -= 0.05;
  }

  throat.intensity = clamp(throat.intensity, 0, 1);
};
