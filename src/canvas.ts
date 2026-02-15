import type { Z } from "./help/math";

export const strokeLine = (
  context: CanvasRenderingContext2D,
  start: Z,
  end: Z,
  { lineWidth }: Partial<CanvasPathDrawingStyles> = {},
) => {
  if (lineWidth !== undefined) {
    context.lineWidth = lineWidth;
  }
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
};
