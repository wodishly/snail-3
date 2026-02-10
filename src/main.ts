import { drawUi, initUi, makeUi, shapeToFitScreen, updateTouches } from "./ui";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./tract";
import { drawTractUi, initTractUi, makeMouthflesh } from "./tractUi";
import type { Assert } from "./help/type";
import { makeSnail } from "./snail";
import { drawKeyboard } from "./throatUi";

window.onload = () => {
  document.body.style.cursor = "pointer";

  const backCtx = (
    document.getElementById("backCanvas") as Assert<HTMLCanvasElement>
  ).getContext("2d")!;

  const tractCtx = (
    document.getElementById("tractCanvas") as Assert<HTMLCanvasElement>
  ).getContext("2d")!;

  const snail = makeSnail();
  const throat = makeThroat();
  const ui = makeUi();
  const tract = makeMouth();
  const tractUi = makeMouthflesh(tract, tractCtx);

  drawKeyboard(backCtx);
  initUi(ui, tract, tractUi, snail, throat, tractCtx);
  initMouth(tract);
  initTractUi(tractUi, backCtx);

  const redraw = () => {
    shapeToFitScreen(ui, backCtx, tractCtx);
    drawTractUi(tractUi, throat, ui, tractCtx);
    drawUi(ui, tractCtx, snail);
    requestAnimationFrame(redraw);
    updateTouches(ui);
  };
  requestAnimationFrame(redraw);
};
