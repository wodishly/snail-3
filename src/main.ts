import "./style.css";

import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import { makeSnail } from "./snail";
import { updateLeech } from "./leech";
import { mouthfleshTools } from "./mouthflesh";
import { fleshTools } from "./flesh";
import { getContexts } from "./canvas";
import { think } from "./brain";
import { stepSpell } from "./songboard";

window.onload = () => {
  const { backcontext, forecontext } = getContexts();

  const { startFlesh, makeFlesh, updateTouches } = fleshTools();
  const { drawMouthflesh, startMouthflesh, makeMouthflesh } = mouthfleshTools();

  const snail = makeSnail();
  const throat = makeThroat();
  const mouth = makeMouth();
  const flesh = makeFlesh();
  const mouthflesh = makeMouthflesh();

  startFlesh(snail, mouth, throat, flesh, mouthflesh, forecontext);
  initMouth(mouth);

  const brain = startMouthflesh(
    0,
    snail,
    throat,
    mouth,
    flesh,
    mouthflesh,
    backcontext,
    forecontext,
  );

  const redraw = (now: number) => {
    drawMouthflesh(mouthflesh, forecontext, mouth);
    updateTouches(flesh);

    think(now, brain, mouthflesh);
    // console.log(throat.intensity); // todo make it so intensity climbs up to 1 by 0.13 instead of being instant
    updateLeech(flesh, mouthflesh);
    stepSpell(now, flesh, brain);
    requestAnimationFrame(redraw);
  };
  requestAnimationFrame(redraw);
};
