import { UI } from "./grui";
import { makeThroat } from "./grottis";
import { Tract } from "./gract";
import { TractUI } from "./gractui";
import type { Assert } from "./type";
import { makeSnail } from "./grail";
import { drawKeyboard } from "./glottisUi";

window.onload = () => {
  document.body.style.cursor = "pointer";

  const backCtx = (
    document.getElementById("backCanvas") as Assert<HTMLCanvasElement>
  ).getContext("2d")!;
  const tractCanvas = document.getElementById(
    "tractCanvas",
  ) as Assert<HTMLCanvasElement>;
  const tractCtx = tractCanvas.getContext("2d")!;

  const snail = makeSnail();
  const throat = makeThroat();
  drawKeyboard(backCtx);
  UI.init(snail, throat);
  Tract.init();
  TractUI.init(backCtx, tractCtx);

  const redraw = () => {
    UI.shapeToFitScreen();
    TractUI.draw(throat, { x: tractCanvas.width, y: tractCanvas.height });
    UI.draw(tractCtx, snail);
    requestAnimationFrame(redraw);
    UI.updateTouches();
  };
  requestAnimationFrame(redraw);
};
