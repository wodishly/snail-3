import "./style.css";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import { makeSnail } from "./snail";
import { updateLeech } from "./leech";
import { mouthfleshTools } from "./mouthflesh";
import { fleshTools } from "./flesh";
import { getContexts } from "./canvas";
import { makeBrain, think } from "./brain";

window.onload = () => {
  const { backcontext, forecontext } = getContexts();

  const { startFlesh, makeFlesh, updateTouches } = fleshTools();
  const { drawMouthflesh, startMouthflesh, makeMouthflesh } = mouthfleshTools();

  const brain = makeBrain();

  const snail = makeSnail();
  const throat = makeThroat();
  const mouth = makeMouth();
  const flesh = makeFlesh();
  const mouthflesh = makeMouthflesh();

  startFlesh(snail, mouth, throat, flesh, mouthflesh, forecontext);
  initMouth(mouth);
  startMouthflesh(
    snail,
    brain,
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

    think(now, brain);
    // console.log(throat.intensity); // todo make it so intensity climbs up to 1 by 0.13 instead of being instant
    updateLeech(brain, flesh, mouthflesh);
    requestAnimationFrame(redraw);
  };
  requestAnimationFrame(redraw);
};
