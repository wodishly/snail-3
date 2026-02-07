import { clamp, type Z } from "./math";

export interface Ui {
  width: number;
  margin: Z;
  touchesWithMouse: Touch[];
  touch: Touch;
  mouseDown: boolean;
  backCanvas: HTMLCanvasElement;
  tractCanvas: HTMLCanvasElement;
}

const UiSettings = {
  start: {
    width: 600,
    margin: { x: 5, y: 5 },
  },
} as const;

type TouchId = `mouse${number}`;

export type Touch<B extends boolean = boolean> = {
  endTime: number;
  isAlive: B;
  fricativeIntensity: number;
} & (B extends true ? TouchInfo : unknown);

export const isAlive = (touch: Touch): touch is Touch<true> => {
  return touch.isAlive;
};

type TouchInfo = {
  startTime: number;
  id: TouchId;
  z: Z;
  index: number;
  diameter: number;
};

export type TractUi = any;
export type Glottis = any;

export const makeUi = (
  backCanvas: HTMLCanvasElement,
  tractCanvas: HTMLCanvasElement,
): Ui => {
  const ui: Ui = {
    ...UiSettings.start,
    touchesWithMouse: [],
    touch: { endTime: 0, isAlive: true, fricativeIntensity: 0 },
    mouseDown: false,
    backCanvas,
    tractCanvas,
  };

  window.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    ui.mouseDown = true;
    startMouse(ui, tractUi, glottis, e);
  });
  window.addEventListener("pointerup", (e) => {
    ui.mouseDown = false;
    endMouse(ui, tractUi, glottis, e);
  });
  window.addEventListener("pointermove", (e) => moveMouse(ui, tractUi, e));

  return ui;
};

export const startMouse = (
  ui: Ui,
  tractUi: TractUi,
  glottis: Glottis,
  e: PointerEvent,
) => {
  const z = {
    x: ((e.pageX - ui.tractCanvas.offsetLeft) / ui.width) * 600,
    y: ((e.pageY - ui.tractCanvas.offsetTop) / ui.width) * 600,
  };
  const touch: Touch<true> = {
    startTime: performance.now(),
    fricativeIntensity: 0,
    endTime: 0,
    isAlive: true,
    id: `mouse${Math.random()}`,
    z,
    index: tractUi.getIndex(z.x, z.y),
    diameter: tractUi.getDiameter(z.x, z.y),
  };
  ui.touch = touch;
  ui.touchesWithMouse.push(touch);
  handleTouches(ui, tractUi, glottis, e);
};

export const moveMouse = (
  ui: Ui,
  tractUi: TractUi,
  glottis: Glottis,
  e: PointerEvent,
) => {
  if (ui.touch === undefined || !isAlive(ui.touch)) {
    return;
  }
  ui.touch.z = {
    x: ((e.pageX - ui.tractCanvas.offsetLeft) / ui.width) * 600,
    y: ((e.pageY - ui.tractCanvas.offsetTop) / ui.width) * 600,
  };
  ui.touch.index = tractUi.getIndex(ui.touch.z.x, ui.touch.z.y);
  ui.touch.diameter = tractUi.getDiameter(ui.touch.z.x, ui.touch.z.y);
  handleTouches(ui, tractUi, glottis, e);
};

export const untouch = (ui: Ui) => {
  ui.touch = {
    endTime: performance.now(),
    isAlive: false,
    fricativeIntensity: 0,
  };
};

export const endMouse = (
  ui: Ui,
  tractUi: TractUi,
  glottis: Glottis,
  e: PointerEvent,
) => {
  if (ui.touch === undefined || !isAlive(ui.touch)) {
    return;
  }
  untouch(ui);
  handleTouches(ui, tractUi, glottis, e);
};

export const handleTouches = (
  ui: Ui,
  tractUi: TractUi,
  glottis: Glottis,
  e: PointerEvent,
) => {
  handleTractUiTouches(tractUi);
  handleGlottisTouches(glottis);
};

export const updateTouches = (ui: Ui) => {
  const fricativeAttackTime = 0.1;
  const now = performance.now();
  for (let i = ui.touchesWithMouse.length - 1; i >= 0; i--) {
    const touch = ui.touchesWithMouse[i];

    if (!isAlive(touch) && now > touch.endTime + 1) {
      ui.touchesWithMouse.splice(i, 1);
    } else if (isAlive(touch)) {
      touch.fricativeIntensity = clamp(
        (now - touch.startTime) / fricativeAttackTime,
        0,
        1,
      );
    } else {
      touch.fricativeIntensity = clamp(
        1 - (now - touch.endTime) / fricativeAttackTime,
        0,
        1,
      );
    }
  }
};

export const shapeToFitScreen = (ui: Ui) => {
  if (window.innerWidth <= window.innerHeight) {
    ui.width = window.innerWidth - 10;
    ui.margin = { x: 5, y: 0.5 * (window.innerHeight - ui.width) };
  } else {
    ui.width = window.innerHeight - 10;
    ui.margin = { x: 0.5 * (window.innerWidth - ui.width), y: 5 };
  }
  document.body.style.marginLeft = ui.margin.x.toString();
  document.body.style.marginTop = ui.margin.y.toString();
  ui.tractCanvas.style.width = ui.width.toString();
  ui.backCanvas.style.width = ui.width.toString();
};
