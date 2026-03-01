import type { Z } from "./help/math";
import type { Assert } from "./help/type";
import type { Mouth } from "./mouth";
import { Mouthbook, noseLength, Settings } from "./settings";

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

export const getContexts = () => {
  return {
    backcontext: (
      document.getElementById("backcanvas") as Assert<HTMLCanvasElement>
    ).getContext("2d")!,
    forecontext: (
      document.getElementById("forecanvas") as Assert<HTMLCanvasElement>
    ).getContext("2d")!,
  };
};

export const canvasToTongueBerth = ({ x, y }: Z) => {
  let winkle = Math.atan2(
    y - Settings.mouthflesh.originY,
    x - Settings.mouthflesh.originX,
  );
  while (winkle > 0) {
    winkle -= 2 * Math.PI;
  }

  return (
    ((Math.PI + winkle - Settings.mouthflesh.angleOffset) *
      (Mouthbook.lipStart - 1)) /
    (Settings.mouthflesh.angleScale * Math.PI)
  );
};

export const canvasToTongueWidth = ({ x, y }: Z) => {
  const offsetX = x - Settings.mouthflesh.originX;
  const offsetY = y - Settings.mouthflesh.originY;

  const length = Math.sqrt(offsetX ** 2 + offsetY ** 2);

  return (Settings.mouthflesh.radius - length) / Settings.mouthflesh.scale;
};

export const canvasToTongue = (z: Z) => {
  return { berth: canvasToTongueBerth(z), width: canvasToTongueWidth(z) };
};

/**
 * @param berth @trombone index
 * @param width @trombone diameter
 */
export const tongueToCanvas = (
  berth: number, // cf. index
  width: number, // cf. diameter
  wobbleSettings?: { doesWobble: boolean; mouth: Mouth },
) => {
  const wobble =
    wobbleSettings === undefined
      ? 0
      : ((wobbleSettings.mouth.maxAmplitude[Mouthbook.length - 1]! +
          wobbleSettings.mouth.nose.maxAmplitude[noseLength() - 1]!) *
          (0.03 *
            Math.sin(2 * berth - 50 * (performance.now() / 1000)) *
            berth)) /
        Mouthbook.length;
  const angle =
    Settings.mouthflesh.angleOffset +
    (berth * Settings.mouthflesh.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1) +
    wobble;
  const r =
    Settings.mouthflesh.radius -
    Settings.mouthflesh.scale * width +
    100 * wobble;

  return {
    x: Settings.mouthflesh.originX - r * Math.cos(angle),
    y: Settings.mouthflesh.originY - r * Math.sin(angle),
  };
};
