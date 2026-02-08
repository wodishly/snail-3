import { createNoise2D } from "simplex-noise";
import { noiseWith } from "./math";
import { UI } from "./grui";
import { Glottis, initGlottis } from "./grottis";
import { Tract } from "./gract";
import { TractUI } from "./gractui";
import type { Assert } from "./type";
import { makeSnail } from "./grail";

const noise = createNoise2D();
export const simplex1 = (x: number) => noiseWith(noise, x);

export var temp = { a: 0, b: 0 };

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

  UI.init(snail);
  initGlottis(Glottis, backCtx);
  Tract.init();
  TractUI.init(backCtx, tractCtx);

  requestAnimationFrame(redraw);
  function redraw() {
    UI.shapeToFitScreen();
    TractUI.draw({ x: tractCanvas.width, y: tractCanvas.height });
    UI.draw(tractCtx, snail);
    requestAnimationFrame(redraw);
    UI.updateTouches();
  }
};
