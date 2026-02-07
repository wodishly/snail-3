import { type NoiseFunction2D } from "simplex-noise";

export type Z<X extends number = number, Y extends number = number> = {
  x: X;
  y: Y;
};

export type Rightnook<
  X extends number = number,
  Y extends number = number,
  W extends number = number,
  H extends number = number,
> = {
  x: X;
  y: Y;
  w: W;
  h: H;
};

export const clamp = (n: number, lower: number, upper: number) => {
  if (n <= lower) {
    return lower;
  } else if (n >= upper) {
    return upper;
  } else {
    return n;
  }
};

export const nudge = (n: number, goal: number, up: number, down = up) => {
  if (n < goal) {
    return Math.min(n + up, goal);
  } else {
    return Math.max(n - down, goal);
  }
};

export const noiseWith = (f: NoiseFunction2D, x: number) => {
  return f(x * 1.2, -x * 0.7);
};
