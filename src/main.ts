import { drawUi, initUi, makeUi, shapeToFitScreen, updateTouches } from "./ui";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import { drawTractUi, initTractUi, makeMouthflesh } from "./tractUi";
import type { Assert } from "./help/type";
import { makeSnail } from "./snail";
import { drawKeyboard } from "./throatUi";

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
  const flesh = makeUi();
  const mouthflesh = makeMouthflesh(mouth);

  drawKeyboard(backcontext);
  initUi(flesh, mouth, mouthflesh, snail, throat, forecontext);
  initMouth(mouth);
  initTractUi(mouthflesh, backcontext, forecontext);

  const redraw = () => {
    shapeToFitScreen(flesh, backcontext, forecontext);
    drawTractUi(mouthflesh, forecontext, throat, flesh);
    drawUi(flesh, forecontext, snail);
    requestAnimationFrame(redraw);
    updateTouches(flesh);
  };
  requestAnimationFrame(redraw);
};
