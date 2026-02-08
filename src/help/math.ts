export type Z<X extends number = number, Y extends number = number> = {
  x: X;
  y: Y;
};

export const z = (x: number, y: number): Z => {
  return { x, y };
};

export type Rightnook<
  X extends number = number,
  Y extends number = number,
  W extends number = number,
  H extends number = number,
> = Z<X, Y> & {
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

export const nudge = (
  start: number,
  end: number,
  up: number,
  down: number = up,
) => {
  return start < end ? Math.min(start + up, end) : Math.max(start - down, end);
};
