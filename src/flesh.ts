import { handleMouthfleshTouches } from "./mouthflesh";
import { startSound } from "./snail";
import { clamp } from "./help/math";
import { makeRinemake, type Rine, type Rineful, type Rinemake } from "./rine";
import { canvasToTongue } from "./canvas";
import { makeSongboard, type Songboard } from "./songboard";
import type { Assert } from "./help/type";
import type { Being } from "./being";

export interface Flesh extends Rineful {
  isAutoWobbling: boolean;
  isAlwaysVoicing: boolean;
  isMouseDown: boolean;
  mouserines: Rine[];
  rinemake: Rinemake;
  html: {
    time: HTMLDivElement;
    brain: HTMLDivElement;
    loudlist: HTMLUListElement;
    mouserines: HTMLUListElement;
    rine: HTMLSpanElement;
    songboard: Songboard;
  };
}

export const makeFlesh = (): Flesh => {
  const brain = document.querySelector("#brain") as Assert<HTMLDivElement>;

  return {
    isAutoWobbling: true,
    isAlwaysVoicing: true,
    isMouseDown: false,
    mouserines: [],
    rine: undefined,
    rinemake: makeRinemake(),
    html: {
      time: document.querySelector("#time")!,
      brain,
      loudlist: document.querySelector("#loudlist")!,
      mouserines: document.querySelector("#mouserines")!,
      rine: document.querySelector("#mouthRine")!,
      songboard: makeSongboard(brain),
    },
  };
};

export const startFlesh = (
  being: Being,
  forecontext: CanvasRenderingContext2D,
) => {
  const { flesh } = being;

  flesh.isMouseDown = false;

  forecontext.canvas.addEventListener("pointerdown", (e) => {
    flesh.isMouseDown = true;
    e.preventDefault();
    startMouse(being, forecontext, e);
  });
  forecontext.canvas.addEventListener("pointerup", () => {
    flesh.isMouseDown = false;
    endMouse(being);
  });
  forecontext.canvas.addEventListener("pointermove", (e) => {
    moveMouse(being, forecontext, e);
  });
};

const startMouse = (
  being: Being,
  forecontext: CanvasRenderingContext2D,
  e: PointerEvent,
) => {
  const { snail, throat, mouth, flesh } = being;

  startSound(snail, throat, mouth, flesh);

  const z = {
    x: e.clientX - forecontext.canvas.offsetLeft,
    y: e.clientY - forecontext.canvas.offsetTop,
  };

  const rine = flesh.rinemake(z);
  flesh.rine = rine;
  flesh.mouserines.push(rine);
  handleMouthfleshTouches(being);
};

export const moveMouse = (
  being: Being,
  forecontext: CanvasRenderingContext2D,
  e: PointerEvent,
) => {
  const { flesh } = being;
  if (!flesh.rine || !flesh.rine.isDown) {
    return;
  }

  flesh.rine.x = e.clientX - forecontext.canvas.offsetLeft;
  flesh.rine.y = e.clientY - forecontext.canvas.offsetTop;

  const { berth, width } = canvasToTongue(flesh.rine);
  flesh.rine.berth = berth;
  flesh.rine.width = width;
  handleMouthfleshTouches(being);
};

const endMouse = (being: Being) => {
  const { flesh } = being;

  if (!flesh.rine || !flesh.rine.isDown) {
    return;
  }
  flesh.rine.isDown = false;
  flesh.rine.time!.end = performance.now() / 1000;
  handleMouthfleshTouches(being);
};

export const updateTouches = (being: Being) => {
  const { flesh } = being;

  const fricativeAttackTime = 0.1;
  for (let j = flesh.mouserines.length - 1; j >= 0; j--) {
    const touch = flesh.mouserines[j]!;
    const time = performance.now() / 1000;
    if (touch.isDown) {
      touch.fi = clamp((time - touch.time.start) / fricativeAttackTime, 0, 1);
    } else {
      if (time > touch.time.end + 1) {
        flesh.mouserines.splice(j, 1);
      } else {
        touch.fi = clamp(1 - (time - touch.time.end) / fricativeAttackTime);
      }
    }
  }
};
