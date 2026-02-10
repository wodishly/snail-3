import {
  getDiameter,
  getIndex,
  handleMouthfleshTouches,
  type Mouthflesh,
} from "./mouthflesh";
import { mute, startSound, unmute, type Snail } from "./snail";
import { handleThroatTouches, type Throat } from "./throat";
import { drawButton, handleTouchStart, makeButton } from "./button";
import { clamp, type Z } from "./help/math";
import type { Mouth } from "./mouth";

export type UiType = ReturnType<typeof makeFlesh>;

type RineId<N extends number = number> = `mouse${N}`;

export type Rine = Z & {
  id: RineId;

  startTime: number;
  endTime: number;
  isAlive: boolean;

  index: number;
  diameter: number;
  fricativeIntensity: number;
};

export const makeFlesh = () => {
  return {
    width: 600,
    top_margin: 5,
    left_margin: 5,
    instructionsLine: 0,
    debugText: "",
    isInAboutScreen: true,
    isInInstructionsScreen: false,
    isAutoWobbling: true,
    isAlwaysVoicing: true,
    isMouseDown: false,
    aboutButton: makeButton(460, 392, 140, 30, "about...", true),
    alwaysVoiceButton: makeButton(460, 428, 140, 30, "always voice", true),
    autoWobbleButton: makeButton(460, 464, 140, 30, "pitch wobble", true),
    touchesWithMouse: [] as Rine[],
    mouseTouch: { isAlive: false, endTime: 0 } as Partial<Rine>,
  };
};

export const startFlesh = (
  snail: Snail,
  mouth: Mouth,
  throat: Throat,
  flesh: UiType,
  mouthflesh: Mouthflesh,
  tractContext: CanvasRenderingContext2D,
) => {
  flesh.isMouseDown = false;

  document.addEventListener("pointerdown", (e) => {
    flesh.isMouseDown = true;
    e.preventDefault();
    startMouse(snail, mouth, throat, flesh, mouthflesh, tractContext, e);
  });
  document.addEventListener("pointerup", () => {
    flesh.isMouseDown = false;
    endMouse(mouth, throat, flesh, mouthflesh, tractContext);
  });
  document.addEventListener("pointermove", (e) =>
    moveMouse(mouth, throat, flesh, mouthflesh, tractContext, e),
  );
};

const handleUiTouches = (
  mouth: Mouth,
  throat: Throat,
  flesh: UiType,
  mouthflesh: Mouthflesh,
  tractContext: CanvasRenderingContext2D,
) => {
  handleMouthfleshTouches(mouth, flesh, mouthflesh, tractContext);
  handleThroatTouches(throat, flesh);
};

export const shapeToFitScreen = (
  ui: UiType,
  backCtx: CanvasRenderingContext2D,
  tractCtx: CanvasRenderingContext2D,
) => {
  if (window.innerWidth <= window.innerHeight) {
    ui.width = window.innerWidth - 10;
    ui.left_margin = 5;
    ui.top_margin = 0.5 * (window.innerHeight - ui.width);
  } else {
    ui.width = window.innerHeight - 10;
    ui.left_margin = 0.5 * (window.innerWidth - ui.width);
    ui.top_margin = 5;
  }
  document.body.style.marginLeft = ui.left_margin.toString();
  document.body.style.marginTop = ui.top_margin.toString();
  backCtx.canvas.style.width = ui.width.toString();
  tractCtx.canvas.style.width = ui.width.toString();
};

export const drawUi = (
  ui: UiType,
  tractCtx: CanvasRenderingContext2D,
  audioSystem: Snail,
) => {
  drawButton(ui.alwaysVoiceButton, tractCtx);
  drawButton(ui.autoWobbleButton, tractCtx);
  drawButton(ui.aboutButton, tractCtx);
  if (ui.isInAboutScreen) drawAboutScreen(tractCtx);
  else if (ui.isInInstructionsScreen)
    drawInstructionsScreen(ui, tractCtx, audioSystem);
};

const drawAboutScreen = (tractCtx: CanvasRenderingContext2D) => {
  tractCtx.globalAlpha = 0.8;
  tractCtx.fillStyle = "white";
  tractCtx.rect(0, 0, 600, 600);
  tractCtx.fill();

  drawAboutText(tractCtx);
};

const drawAboutText = (tractCtx: CanvasRenderingContext2D) => {
  tractCtx.globalAlpha = 1.0;
  tractCtx.fillStyle = "#C070C6";
  tractCtx.strokeStyle = "#C070C6";
  tractCtx.font = "50px Arial";
  tractCtx.lineWidth = 3;
  tractCtx.textAlign = "center";
  tractCtx.strokeText("P i n k   T r o m b o n e", 300, 230);
  tractCtx.fillText("P i n k   T r o m b o n e", 300, 230);

  tractCtx.font = "28px Arial";
  tractCtx.fillText("bare-handed  speech synthesis", 300, 330);

  tractCtx.font = "20px Arial";

  if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
    tractCtx.font = "20px Arial";
    tractCtx.fillText(
      "(sorry - may work poorly with the Firefox browser)",
      300,
      430,
    );
  }
};

const instructionsScreenHandleTouch = (
  ui: UiType,
  audioSystem: Snail,
  x: number,
  y: number,
) => {
  if (x >= 35 && x <= 265 && y >= 535 && y <= 570)
    window.location.href = "http://venuspatrol.nfshost.com";
  else if (x >= 370 && x <= 570 && y >= 505 && y <= 555) {
    location.reload();
  } else {
    ui.isInInstructionsScreen = false;
    ui.aboutButton.isOn = true;
    unmute(audioSystem);
  }
};

const buttonsHandleTouchStart = (ui: UiType, rine: Rine) => {
  handleTouchStart(ui.alwaysVoiceButton, rine);
  ui.isAlwaysVoicing = ui.alwaysVoiceButton.isOn;
  handleTouchStart(ui.autoWobbleButton, rine);
  ui.isAutoWobbling = ui.autoWobbleButton.isOn;
  handleTouchStart(ui.aboutButton, rine);
};

const moveMouse = (
  mouth: Mouth,
  throat: Throat,
  flesh: UiType,
  mouthflesh: Mouthflesh,
  tractContext: CanvasRenderingContext2D,
  e: PointerEvent,
) => {
  const rine = flesh.mouseTouch;
  if (!rine.isAlive) {
    return;
  }

  rine.x = ((e.pageX - tractContext.canvas.offsetLeft) / flesh.width) * 600;
  rine.y = ((e.pageY - tractContext.canvas.offsetTop) / flesh.width) * 600;
  rine.index = getIndex({ x: rine.x, y: rine.y });
  rine.diameter = getDiameter({ x: rine.x, y: rine.y });
  handleUiTouches(mouth, throat, flesh, mouthflesh, tractContext);
};

const endMouse = (
  mouth: Mouth,
  throat: Throat,
  flesh: UiType,
  mouthflesh: Mouthflesh,
  tractContext: CanvasRenderingContext2D,
) => {
  const touch = flesh.mouseTouch;
  if (!touch.isAlive) {
    return;
  }
  touch.isAlive = false;
  touch.endTime = performance.now() / 1000;
  handleUiTouches(mouth, throat, flesh, mouthflesh, tractContext);

  if (!flesh.aboutButton.isOn) flesh.isInInstructionsScreen = true;
};

const write = (
  ui: UiType,
  tractCtx: CanvasRenderingContext2D,
  text: string,
) => {
  tractCtx.fillText(text, 50, 100 + ui.instructionsLine * 22);
  ui.instructionsLine += 1;
  if (text === "") {
    ui.instructionsLine -= 0.3;
  }
};

export const updateTouches = (ui: UiType) => {
  const fricativeAttackTime = 0.1;
  for (let j = ui.touchesWithMouse.length - 1; j >= 0; j--) {
    const touch = ui.touchesWithMouse[j];
    const time = performance.now() / 1000;
    if (!touch.isAlive && time > touch.endTime + 1) {
      ui.touchesWithMouse.splice(j, 1);
    } else if (touch.isAlive) {
      touch.fricativeIntensity = clamp(
        (time - touch.startTime) / fricativeAttackTime,
        0,
        1,
      );
    } else {
      touch.fricativeIntensity = clamp(
        1 - (time - touch.endTime) / fricativeAttackTime,
        0,
        1,
      );
    }
  }
};

export const startMouse = (
  snail: Snail,
  mouth: Mouth,
  glottis: Throat,
  flesh: UiType,
  mouthflesh: Mouthflesh,
  tractContext: CanvasRenderingContext2D,
  event: PointerEvent,
) => {
  if (!snail.isStarted) {
    snail.isStarted = true;
    startSound(snail, glottis, mouth, flesh);
  }
  if (flesh.isInAboutScreen) {
    flesh.isInAboutScreen = false;
    return;
  }
  if (flesh.isInInstructionsScreen) {
    var x =
      ((event.pageX - tractContext.canvas.offsetLeft) / flesh.width) * 600;
    var y = ((event.pageY - tractContext.canvas.offsetTop) / flesh.width) * 600;
    instructionsScreenHandleTouch(flesh, snail, x, y);
    return;
  }

  const z = {
    x: ((event.pageX - tractContext.canvas.offsetLeft) / flesh.width) * 600,
    y: ((event.pageY - tractContext.canvas.offsetTop) / flesh.width) * 600,
  };
  const rine: Rine = {
    ...z,
    startTime: performance.now() / 1000,
    fricativeIntensity: 0,
    endTime: 0,
    isAlive: true,
    id: `mouse${Math.random()}`,
    index: getIndex(z),
    diameter: getDiameter(z),
  };
  flesh.mouseTouch = rine;
  flesh.touchesWithMouse.push(rine);
  buttonsHandleTouchStart(flesh, rine);
  handleUiTouches(mouth, glottis, flesh, mouthflesh, tractContext);
};

export const drawInstructionsScreen = (
  ui: UiType,
  tractCtx: CanvasRenderingContext2D,
  audioSystem: Snail,
) => {
  mute(audioSystem);
  var ctx = tractCtx;
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "white";
  ctx.rect(0, 0, 600, 600);
  ctx.fill();

  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "#C070C6";
  ctx.strokeStyle = "#C070C6";
  ctx.font = "24px Arial";
  ctx.lineWidth = 2;
  ctx.textAlign = "center";

  ctx.font = "19px Arial";
  ctx.textAlign = "left";
  ui.instructionsLine = 0;
  write(
    ui,
    tractCtx,
    "Sound is generated in the glottis (at the bottom left) then ",
  );
  write(
    ui,
    tractCtx,
    "filtered by the shape of the vocal tract. The voicebox ",
  );
  write(ui, tractCtx, "controls the pitch and intensity of the initial sound.");
  write(ui, tractCtx, "");
  write(ui, tractCtx, "Then, to talk:");
  write(ui, tractCtx, "");
  write(ui, tractCtx, "- move the body of the tongue to shape vowels");
  write(ui, tractCtx, "");
  write(
    ui,
    tractCtx,
    "- touch the oral cavity to narrow it, for fricative consonants",
  );
  write(ui, tractCtx, "");
  write(
    ui,
    tractCtx,
    "- touch above the oral cavity to close it, for stop consonants",
  );
  write(ui, tractCtx, "");
  write(
    ui,
    tractCtx,
    "- touch the nasal cavity to open the velum and let sound ",
  );
  write(ui, tractCtx, "   flow through the nose.");
  write(ui, tractCtx, "");
  write(ui, tractCtx, "");
  write(ui, tractCtx, "(tap anywhere to continue)");

  ctx.textAlign = "center";
  ctx.fillText("[tap here to RESET]", 470, 535);

  ui.instructionsLine = 18.8;
  ctx.textAlign = "left";
  write(ui, tractCtx, "Pink Trombone v1.1");
  write(ui, tractCtx, "by Neil Thapen");
  ctx.fillStyle = "blue";
  ctx.globalAlpha = 0.6;
  write(ui, tractCtx, "venuspatrol.nfshost.com");

  ctx.globalAlpha = 1.0;
};
