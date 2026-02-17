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

export const clamp = (n: number, lower = 0, upper = 1) => {
  if (n <= lower) {
    return lower;
  } else if (n >= upper) {
    return upper;
  } else {
    return n;
  }
};

export const weave = (start: number, end: number, n: number) => {
  return start + (end - start) * n;
};

export const nudge = (
  start: number,
  end: number,
  up: number,
  down: number = up,
) => {
  return start < end ? Math.min(start + up, end) : Math.max(start - down, end);
};

export type W<R extends number = number, A extends number = number> = {
  r: R;
  a: A;
};

export const w = (r: number, a: number): W => {
  return { r, a };
};

export const wz = ({ r, a }: W): Z => {
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
};

export const zw = ({ x, y }: Z): W => {
  return { r: Math.sqrt(x ** 2 + y ** 2), a: Math.atan2(y, x) };
};

export const more = ({ x: x0, y: y0 }: Z, { x: x1, y: y1 }: Z): Z => {
  return { x: x1 + x0, y: y1 + y0 };
};

export const less = ({ x: x0, y: y0 }: Z, { x: x1, y: y1 }: Z): Z => {
  return { x: x1 - x0, y: y1 - y0 };
};

export const lessW = (w0: W, w1: W): W => {
  return zw(less(wz(w0), wz(w1)));
};

// const farth = (
//   { x: x0, y: y0 }: Z,
//   { x: x1, y: y1 }: Z = { x: 0, y: 0 },
// ): number => {
//   return Math.sqrt((x1 - x0) ** 2 + (y1 - y0) ** 2);
// };

export const farthW = ({ r: r0, a: a0 }: W, { r: r1, a: a1 }: W): number => {
  return Math.sqrt(r0 ** 2 + r1 ** 2 - 2 * r0 * r1 * Math.cos(a1 - a0));
};

// const toOne = (z: Z, one = 1): Z => {
//   const f = farth(z);
//   return { x: (z.x * one) / f, y: (z.y * one) / f };
// };
//
// const toOneW = ({ a }: W, one = 1): W => {
//   return { r: one, a };
// };
