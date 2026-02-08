import {
  drawUi,
  initUi,
  makeUi,
  shapeToFitScreen,
  updateTouches,
} from "./grui";
import { makeThroat } from "./grottis";
import { Tract } from "./gract";
import { TractUI } from "./gractui";
import type { Assert } from "./type";
import { makeSnail } from "./grail";
import { drawKeyboard } from "./glottisUi";

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

  drawKeyboard(backCtx);
  initUi(ui, snail, throat, tractCanvas);
  Tract.init();
  TractUI.init(backCtx, tractCtx);

  const redraw = () => {
    shapeToFitScreen(ui, tractCanvas, backCanvas);
    TractUI.drawTractUi(throat, ui, {
      x: tractCanvas.width,
      y: tractCanvas.height,
    });
    drawUi(ui, tractCtx, snail);
    requestAnimationFrame(redraw);
    updateTouches(ui);
  };
  requestAnimationFrame(redraw);
};
