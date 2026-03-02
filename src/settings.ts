import { plus, minus, halve, after } from "./help/rime";

export const palePink = "#ffeef5";

export const Mouthbook = {
  /** Where the body of the tongue begins. */
  bodyStart: 10,

  /** Where the body of the tongue meets the sail. */
  noseStart: 17,

  /** Where the blade of the tongue begins. */
  bladeStart: 32,

  /** Where the lips begin. */
  lipStart: 39,

  /** The length of the mouth. */
  length: 44,
} as const;

export const noseLength = () =>
  after(minus(Mouthbook.length, Mouthbook.noseStart));
export const tongueLowerBound = () => plus(Mouthbook.bodyStart, 2);
export const tongueUpperBound = () => minus(Mouthbook.bladeStart, 3);
export const tongueMiddle = () =>
  halve(plus(tongueLowerBound(), tongueUpperBound()));

/**
 * Allworldly sooth.
 */
export const Fastenings = {
  blockLength: 512,
  reflection: {
    glottal: 0.75,
    lip: -0.85,
  },

  lip: {
    ring: 0.5,
    unring: 1.5,
  },
  /** Of the sail that hides the nosehole from the mouthhole. */
  sail: {
    /** Of the sail at rest. */
    rest: 0.01,

    /** Of the gay sail. */
    gay: 0.35,

    /** Of the sail that bears a nose-loudness. */
    nosebear: 0.4,
  },
} as const;

/**
 * Worldly truth.
 */
export const Settings = {
  start: {
    lip: { width: 1.5 },
    tongue: {
      berth: 12.9,
      width: 2.43,
    },
    sail: { width: 0.01 },
    lung: { strength: 1 },
  },
  beat: 250, // s/1000
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
