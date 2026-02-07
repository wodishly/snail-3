import { createNoise2D } from "simplex-noise";
import { noiseWith } from "./math";
import { UI } from "./grui";
import { Glottis } from "./grottis";
import { Tract } from "./gract";
import { TractUI } from "./gractui";
import type { Assert } from "./type";
import { AudioSystem } from "./graudiosystem";

const noise = createNoise2D();
export const simplex1 = (x: number) => noiseWith(noise, x);

export var backCtx = (
  document.getElementById("backCanvas") as Assert<HTMLCanvasElement>
).getContext("2d")!;
export var tractCtx = (
  document.getElementById("tractCanvas") as Assert<HTMLCanvasElement>
).getContext("2d")!;

export var time = 0;
export var temp = { a: 0, b: 0 };
export var isFirefox = false;
var browser = navigator.userAgent.toLowerCase();
if (browser.indexOf("firefox") > -1) isFirefox = true;

window.onload = () => {
  document.body.style.cursor = "pointer";

  AudioSystem.init();
  UI.init();
  Glottis.init();
  Tract.init();
  TractUI.init();

  requestAnimationFrame(redraw);
  function redraw() {
    UI.shapeToFitScreen();
    TractUI.draw();
    UI.draw();
    requestAnimationFrame(redraw);
    time = performance.now() / 1000;
    UI.updateTouches();
  }
};
