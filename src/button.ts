import type { Rightnook } from "./help/math";
import { palePink } from "./settings";

type Button = Rightnook & {
  text: string;
  isOn: boolean;
};

export const makeButton = (
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  isOn: boolean,
): Button => {
  return {
    x,
    y,
    w,
    h,
    text,
    isOn,
  };
};

export const drawButton = (button: Button, context: CanvasRenderingContext2D) => {
  var radius = 10;
  context.strokeStyle = palePink;
  context.fillStyle = palePink;
  context.globalAlpha = 1.0;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 2 * radius;

  context.beginPath();
  context.moveTo(button.x + radius, button.y + radius);
  context.lineTo(button.x + button.w - radius, button.y + radius);
  context.lineTo(button.x + button.w - radius, button.y + button.h - radius);
  context.lineTo(button.x + radius, button.y + button.h - radius);
  context.closePath();
  context.stroke();
  context.fill();

  context.font = "16px Arial";
  context.textAlign = "center";
  if (button.isOn) {
    context.fillStyle = "orchid";
    context.globalAlpha = 0.6;
  } else {
    context.fillStyle = "white";
    context.globalAlpha = 1.0;
  }
  drawText(button, context);
};
export const drawText = (
  button: Button,
  context: CanvasRenderingContext2D,
) => {
  context.fillText(
    button.text,
    button.x + button.w / 2,
    button.y + button.h / 2 + 6,
  );
};

export const handleTouchStart = (grutton: Button, touch: any) => {
  if (
    touch.x >= grutton.x &&
    touch.x <= grutton.x + grutton.w &&
    touch.y >= grutton.y &&
    touch.y <= grutton.y + grutton.h
  ) {
    grutton.isOn = !grutton.isOn;
  }
};
