import "./style.css";
import {
  drawUi,
  startFlesh,
  makeFlesh,
  updateTouches,
  type Flesh,
} from "./flesh";
import { makeThroat } from "./throat";
import { initMouth, makeMouth } from "./mouth";
import {
  drawMouthflesh,
  startMouthflesh,
  makeMouthflesh,
  type Mouthflesh,
} from "./mouthflesh";
import { makeSnail } from "./snail";
import { drawKeyboard } from "./keyboard";
import type { Assert } from "./help/type";
import type { Floor } from "./help/rime";

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
    // shapeToFitScreen(flesh, backcontext, forecontext);
    drawMouthflesh(mouthflesh, forecontext, mouth, throat, flesh);
    drawUi(flesh, forecontext, snail);
    requestAnimationFrame(redraw);
    updateTouches(flesh);

    updateDebugger(flesh, mouthflesh);

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

type DeepRound<T extends object, N extends number = 0> = {
  [K in keyof T]: T[K] extends object
    ? DeepRound<T[K], N>
    : T[K] extends number
      ? Floor<T[K]>
      : T[K];
};

const deepRound = <T extends object>(x: T, n = 0) => {
  const y = {};
  for (const [k, v] of Object.entries(x)) {
    Object.assign(y, {
      [k]:
        typeof v === "object"
          ? deepRound(v, n)
          : typeof v === "number"
            ? v.toFixed(n)
            : v,
    });
  }
  return y as Assert<DeepRound<T>>;
};

const updateDebugger = (flesh: Flesh, mouthflesh: Mouthflesh) => {
  flesh.html.mouseTouch.innerHTML = JSON.stringify(flesh.mouseTouch);
  flesh.html.mouserines.innerHTML = flesh.mouserines
    .map((rine) => {
      const li = document.createElement("li");
      li.innerHTML = JSON.stringify(deepRound(rine));
      return li.outerHTML;
    })
    .join("");
  mouthflesh.html.tongueRine.innerHTML = JSON.stringify(mouthflesh.tongueRine);
};
