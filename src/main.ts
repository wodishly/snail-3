import {
  drawUi,
  startFlesh,
  makeFlesh,
  shapeToFitScreen,
  updateTouches,
} from "./flesh";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import { drawMouthflesh, initTractUi, makeMouthflesh } from "./mouthflesh";
import type { Assert } from "./help/type";
import { makeSnail } from "./snail";
import { drawKeyboard } from "./keyboard";

window.onload = () => {
  document.body.style.cursor = "pointer";

  const backcontext = (
    document.getElementById("backCanvas") as Assert<HTMLCanvasElement>
  ).getContext("2d")!;

  const forecontext = (
    document.getElementById("tractCanvas") as Assert<HTMLCanvasElement>
  ).getContext("2d")!;

  const snail = makeSnail();
  const throat = makeThroat();
  const mouth = makeMouth();
  const flesh = makeFlesh();
  const mouthflesh = makeMouthflesh();

  drawKeyboard(backcontext);
  startFlesh(snail, mouth, throat, flesh, mouthflesh, forecontext);
  initMouth(mouth);
  initTractUi(mouth, mouthflesh, backcontext, forecontext);

  const redraw = () => {
    shapeToFitScreen(flesh, backcontext, forecontext);
    drawMouthflesh(mouthflesh, forecontext, mouth, throat, flesh);
    drawUi(flesh, forecontext, snail);
    requestAnimationFrame(redraw);
    updateTouches(flesh);
  };
  requestAnimationFrame(redraw);
};
