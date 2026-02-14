import "./style.css";
import {
  drawUi,
  startFlesh,
  makeFlesh,
  shapeToFitScreen,
  updateTouches,
  moveMouse,
} from "./flesh";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import {
  drawMouthflesh,
  startMouthflesh,
  makeMouthflesh,
  tongueToCanvas,
} from "./mouthflesh";
import { makeSnail } from "./snail";
import { drawKeyboard } from "./keyboard";
import { Settings, tongueLowerBound, tongueUpperBound } from "./settings";
import type { Assert } from "./help/type";
import { ly } from "./help/mean";

window.onload = () => {
  const backcontext = (
    document.getElementById("forecanvas") as Assert<HTMLCanvasElement>
  ).getContext("2d")!;
  const forecontext = (
    document.getElementById("backcanvas") as Assert<HTMLCanvasElement>
  ).getContext("2d")!;

  const snail = makeSnail();
  const throat = makeThroat();
  const mouth = makeMouth();
  const flesh = makeFlesh();
  const mouthflesh = makeMouthflesh();

  drawKeyboard(backcontext);
  startFlesh(snail, mouth, throat, flesh, mouthflesh, forecontext);
  initMouth(mouth);
  startMouthflesh(mouth, mouthflesh, backcontext, forecontext);

  const redraw = () => {
    shapeToFitScreen(flesh, backcontext, forecontext);
    drawMouthflesh(mouthflesh, forecontext, mouth, throat, flesh);
    drawUi(flesh, forecontext, snail);
    requestAnimationFrame(redraw);
    updateTouches(flesh);

    // mouthflesh.tongueBerth += 0.1;
    // if (mouthflesh.tongueBerth > tongueUpperBound()) {
    //   mouthflesh.tongueBerth = tongueLowerBound();
    // }

    // mouthflesh.tongueWidth += Math.PI / 300;
    // if (mouthflesh.tongueWidth > Settings.mouthflesh.outerTongueControlRadius) {
    //   mouthflesh.tongueWidth = Settings.mouthflesh.innerTongueControlRadius;
    // }

    // const { x, y } = reckon(mouthflesh.tongueBerth, mouthflesh.tongueWidth);
    // moveMouse(
    //   mouth,
    //   throat,
    //   flesh,
    //   mouthflesh,
    //   forecontext,
    //   new PointerEvent("pointermove", { clientX: x, clientY: y }),
    // );
  };
  requestAnimationFrame(redraw);
};
