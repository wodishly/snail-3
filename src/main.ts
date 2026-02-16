import "./style.css";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import { makeSnail } from "./snail";
import { updateLeech } from "./leech";
import { mouthfleshTools } from "./mouthflesh";
import { fleshTools } from "./flesh";
import { getContexts } from "./canvas";
import { makeSong, sing } from "./speak";

window.onload = () => {
  const { backcontext, forecontext } = getContexts();

  const { startFlesh, makeFlesh, updateTouches } = fleshTools();
  const { drawMouthflesh, startMouthflesh, makeMouthflesh } = mouthfleshTools();

  const snail = makeSnail();
  const throat = makeThroat();
  const mouth = makeMouth();
  const flesh = makeFlesh();
  const mouthflesh = makeMouthflesh();

  const song = makeSong();

  startFlesh(snail, mouth, throat, flesh, mouthflesh, forecontext);
  initMouth(mouth);
  startMouthflesh(
    snail,
    throat,
    mouth,
    flesh,
    mouthflesh,
    song,
    backcontext,
    forecontext,
  );

  const redraw = (now: number) => {
    drawMouthflesh(mouthflesh, forecontext, mouth);
    requestAnimationFrame(redraw);
    updateTouches(flesh);

    sing(song, now, mouth, flesh, mouthflesh, forecontext);
    updateLeech(song, flesh, mouthflesh);
  };
  requestAnimationFrame(redraw);
};
