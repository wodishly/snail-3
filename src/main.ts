import {
  drawUi,
  initUi,
  makeUi,
  shapeToFitScreen,
  updateTouches,
} from "./ui";
import { makeThroat } from "./throat";
import { Tract } from "./tract";
import { drawTractUi, initTractUi, makeTractUi } from "./tractUi";
import type { Assert } from "./help/type";
import { makeSnail } from "./snail";
import { drawKeyboard } from "./throatUi";

window.onload = () => {
  document.body.style.cursor = "pointer";

  const backCanvas = document.getElementById(
    "backCanvas",
  ) as Assert<HTMLCanvasElement>;
  const backCtx = backCanvas.getContext("2d")!;

  const tractCanvas = document.getElementById(
    "tractCanvas",
  ) as Assert<HTMLCanvasElement>;
  const tractCtx = tractCanvas.getContext("2d")!;

  const snail = makeSnail();
  const throat = makeThroat();
  const ui = makeUi();
  const tractUi = makeTractUi();

  drawKeyboard(backCtx);
  initUi(ui, tractUi, snail, throat, tractCanvas);
  Tract.init();
  initTractUi(tractUi, backCtx, tractCtx);

  const redraw = () => {
    shapeToFitScreen(ui, tractCanvas, backCanvas);
    drawTractUi(tractUi, throat, ui, {
      x: tractCanvas.width,
      y: tractCanvas.height,
    });
    drawUi(ui, tractCtx, snail);
    requestAnimationFrame(redraw);
    updateTouches(ui);
  };
  requestAnimationFrame(redraw);
};
