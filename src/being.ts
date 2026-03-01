import type { Brain } from "./brain";
import { getContexts } from "./canvas";
import { makeFlesh, startFlesh, type Flesh } from "./flesh";
import { startMouth, makeMouth, type Mouth } from "./mouth";
import { makeMouthflesh, startMouthflesh, type Mouthflesh } from "./mouthflesh";
import { makeSnail, type Snail } from "./snail";
import { makeThroat, type Throat } from "./throat";

export type Being = {
  now: number;
  snail: Snail;
  throat: Throat;
  mouth: Mouth;
  flesh: Flesh;
  mouthflesh: Mouthflesh;
  brain: Brain;
  forecontext: CanvasRenderingContext2D;
  backcontext: CanvasRenderingContext2D;
};

export const become = (now: number = 0): Being => {
  const snail = makeSnail();
  const throat = makeThroat();
  const mouth = makeMouth();
  const flesh = makeFlesh();
  const mouthflesh = makeMouthflesh();

  const { backcontext, forecontext } = getContexts();

  startFlesh(snail, mouth, throat, flesh, mouthflesh, forecontext);
  startMouth(mouth);

  return {
    now,
    snail,
    throat,
    mouth,
    flesh,
    mouthflesh,
    brain: startMouthflesh(
      now,
      snail,
      throat,
      mouth,
      flesh,
      mouthflesh,
      backcontext,
      forecontext,
    ),
    forecontext,
    backcontext,
  };
};
