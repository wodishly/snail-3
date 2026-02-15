import { plus, minus, halve } from "./help/rime";

export const palePink = "#ffeef5";

export const Mouthbook = {
  bladeStart: 10,
  noseStart: 17,
  noseLength: 28,
  tipStart: 32,
  lipStart: 39,
  n: 44,
} as const;

export const tongueLowerBound = () => plus(Mouthbook.bladeStart, 2);
export const tongueUpperBound = () => minus(Mouthbook.tipStart, 3);
export const tongueMiddle = () =>
  halve(plus(tongueLowerBound(), tongueUpperBound()));

export const Fastenings = {
  blockLength: 512,
  reflection: {
    glottal: 0.75,
    lip: -0.85,
  },
} as const;

export const Settings = {
  speed: 15, // cm/s
  fade: 1.0, //0.9999,
  vibrato: {
    amount: 0.005,
    frequency: 6,
  },
  sieve: {
    breathy: {
      start: true,
      type: "bandpass",
      sharpness: 500,
      Q: 0.5,
    } satisfies SieveSetting,
    sharp: {
      start: true,
      type: "bandpass",
      sharpness: 1000,
      Q: 0.5,
    } satisfies SieveSetting,
  },
  keyboard: {
    keyboardTop: 500,
    keyboardLeft: 0,
    keyboardWidth: 600,
    keyboardHeight: 100,
    semitones: 20,
    marks: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    baseNote: 87.3071, //F
  },
  mouthflesh: {
    originX: 340,
    originY: 449,
    radius: 298,
    scale: 60,
    fillColour: "pink",
    lineColour: "#c070c6",
    angleScale: 0.64,
    angleOffset: -0.24,
    noseOffset: 0.8,
    gridOffset: 1.7,
    innerTongueControlRadius: 2.05,
    outerTongueControlRadius: 3.5,
  },
} as const;

export type SieveSetting = {
  start: boolean;
  type: "bandpass";
  sharpness: number;
  Q: number;
};
