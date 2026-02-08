export const palePink = "#ffeef5";

export const Mouthbook = {
  bladeStart: 10,
  noseStart: 17,
  noseLength: 28,
  tipStart: 32,
  lipStart: 39,
  n: 44,
} as const;

export const Fastenings = {
  blockLength: 512,
  reflection: {
    glottal: 0.75,
    lip: -0.85,
  },
} as const;

export const Settings = {
  speed: 15, // cm/s
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
  ui: {
    glottis: {
      keyboardTop: 500,
      keyboardLeft: 0,
      keyboardWidth: 600,
      keyboardHeight: 100,
      semitones: 20,
      marks: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
      baseNote: 87.3071, //F
    },
  },
} as const;

export type SieveSetting = {
  start: boolean;
  type: "bandpass";
  sharpness: number;
  Q: number;
};
