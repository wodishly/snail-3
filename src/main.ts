import "./style.css";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import { makeSnail } from "./snail";
import { updateLeech } from "./leech";
import { mouthfleshTools } from "./mouthflesh";
import { fleshTools } from "./flesh";
import { getContexts } from "./canvas";

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
  startMouthflesh(throat, mouth, flesh, mouthflesh, backcontext, forecontext);

  const redraw = () => {
    drawMouthflesh(mouthflesh, forecontext, mouth);
    requestAnimationFrame(redraw);
    updateTouches(flesh);

    updateLeech(flesh, mouthflesh);
  };
  requestAnimationFrame(redraw);
};
