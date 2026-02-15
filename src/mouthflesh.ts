import { type Mouth } from "./mouth";
import { type Throat } from "./throat";
import { type Rine, type Flesh } from "./flesh";
import { clamp, type Z } from "./help/math";
import {
  Mouthbook,
  palePink,
  Settings,
  tongueLowerBound,
  tongueMiddle,
  tongueUpperBound,
} from "./settings";
import type { Assert, Maybe } from "./help/type";
import { strokeLine } from "./canvas";

export type Mouthflesh = {
  /** @trombone `index` */
  tongueBerth: number;

  /** @trombone `diameter` */
  tongueWidth: number;

  /** A rine in the tongue control region. */
  tongueRine: Maybe<Rine>;

  html: {
    tongueRine: HTMLSpanElement;
  };
};

export const makeMouthflesh = (): Mouthflesh => {
  return {
    tongueBerth: 12.9,
    tongueWidth: 2.43,
    tongueRine: undefined as Maybe<Rine>,
    html: {
      tongueRine: document.querySelector(
        "#tongueRine",
      ) as Assert<HTMLSpanElement>,
    },
  };
};

export const startMouthflesh = (
  mouth: Mouth,
  mouthflesh: Mouthflesh,
  backcontext: CanvasRenderingContext2D,
  forecontext: CanvasRenderingContext2D,
) => {
  setRestWidth(mouth, mouthflesh);
  for (let i = 0; i < Mouthbook.n; i++) {
    mouth.width[i].now = mouth.width[i].goal = mouth.width[i].rest;
  }
  drawBackground(mouth, backcontext, forecontext);
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

const drawCircle = (
  context: CanvasRenderingContext2D,
  berth: number,
  width: number,
  halfwidth: number,
) => {
  const angle =
    Settings.mouthflesh.angleOffset +
    (berth * Settings.mouthflesh.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);
  const r = Settings.mouthflesh.radius - Settings.mouthflesh.scale * width;
  context.beginPath();
  context.arc(
    Settings.mouthflesh.originX - r * Math.cos(angle),
    Settings.mouthflesh.originY - r * Math.sin(angle),
    halfwidth,
    0,
    2 * Math.PI,
  );
  context.fill();
};

const labelAmplitude = (
  context: CanvasRenderingContext2D,
  i: number,
  x: number,
  y: number,
) => {
  context.fillStyle = "black";
  context.textBaseline = "middle";
  context.font = "12px sans-serif";
  context.fillText(`${i}`, x, y);
};

const drawAmplitudes = (mouth: Mouth, context: CanvasRenderingContext2D) => {
  context.strokeStyle = "orchid";
  context.lineCap = "butt";
  context.globalAlpha = 0.3;

  // mouth
  for (let i = 2; i < Mouthbook.n - 1; i++) {
    const start = tongueToCanvas(i, 0, { doesWobble: true, mouth });
    const end = tongueToCanvas(i, mouth.width[i].now, {
      doesWobble: true,
      mouth,
    });

    strokeLine(context, start, end, {
      lineWidth: Math.sqrt(mouth.maxAmplitude[i]) * 3,
    });
    labelAmplitude(context, i, (start.x + end.x) / 2, (start.y + end.y) / 2);
  }

  // nose
  for (let i = 1; i < Mouthbook.noseLength - 1; i++) {
    const start = tongueToCanvas(
      i + Mouthbook.noseStart,
      -Settings.mouthflesh.noseOffset,
      { doesWobble: true, mouth },
    );
    const end = tongueToCanvas(
      i + Mouthbook.noseStart,
      -Settings.mouthflesh.noseOffset - mouth.nose.width[i] * 0.9,
      { doesWobble: true, mouth },
    );

    strokeLine(context, start, end, {
      lineWidth: Math.sqrt(mouth.nose.maxAmplitude[i]) * 3,
    });
    labelAmplitude(context, i, (start.x + end.x) / 2, (start.y + end.y) / 2);
  }
  context.globalAlpha = 1;
};

/**
 * Sets `mouth.width[i].rest` for each `i` in `[Mouthbook.bladeStart, Mouthbook.lipStart)`
 */
const setRestWidth = (mouth: Mouth, mouthflesh: Mouthflesh) => {
  for (let i = Mouthbook.bladeStart; i < Mouthbook.lipStart; i++) {
    const t =
      (1.1 * Math.PI * (mouthflesh.tongueBerth - i)) /
      (Mouthbook.tipStart - Mouthbook.bladeStart);
    const fixedTongueDiameter = 2 + (mouthflesh.tongueWidth - 2) / 1.5;
    let curve =
      (1.5 - fixedTongueDiameter + Settings.mouthflesh.gridOffset) *
      Math.cos(t);
    if (i == Mouthbook.bladeStart - 2 || i == Mouthbook.lipStart - 1) {
      curve *= 0.8;
    }
    if (i == Mouthbook.bladeStart || i == Mouthbook.lipStart - 2) {
      curve *= 0.94;
    }
    mouth.width[i].rest = 1.5 - curve;
  }
};

const drawPitchControl = (
  context: CanvasRenderingContext2D,
  throat: Throat,
) => {
  const w = 9;
  const h = 15;
  context.lineWidth = 4;
  context.strokeStyle = "orchid";
  context.globalAlpha = 0.7;

  context.beginPath();
  context.moveTo(throat.z.x - w, throat.z.y - h);
  context.lineTo(throat.z.x + w, throat.z.y - h);
  context.lineTo(throat.z.x + w, throat.z.y + h);
  context.lineTo(throat.z.x - w, throat.z.y + h);
  context.closePath();

  context.stroke();

  context.globalAlpha = 0.15;
  context.fill();

  context.globalAlpha = 1.0;
};

const drawTextStraight = (
  context: CanvasRenderingContext2D,
  index: number,
  diameter: number,
  text: string,
) => {
  const angle =
    Settings.mouthflesh.angleOffset +
    (index * Settings.mouthflesh.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);
  const r = Settings.mouthflesh.radius - Settings.mouthflesh.scale * diameter;
  context.save();
  context.translate(
    Settings.mouthflesh.originX - r * Math.cos(angle),
    Settings.mouthflesh.originY - r * Math.sin(angle) + 2,
  );
  context.fillText(text, 0, 0);
  context.restore();
};

const drawBackground = (
  mouth: Mouth,
  backContext: CanvasRenderingContext2D,
  tractContext: CanvasRenderingContext2D,
) => {
  tractContext = backContext;

  //text
  tractContext.fillStyle = "orchid";
  tractContext.font = "20px Arial";
  tractContext.textAlign = "center";
  tractContext.globalAlpha = 0.7;
  drawText(tractContext, Mouthbook.n * 0.44, -0.28, "soft");
  drawText(tractContext, Mouthbook.n * 0.51, -0.28, "palate");
  drawText(tractContext, Mouthbook.n * 0.77, -0.28, "hard");
  drawText(tractContext, Mouthbook.n * 0.84, -0.28, "palate");
  drawText(tractContext, Mouthbook.n * 0.95, -0.28, " lip");

  tractContext.font = "17px Arial";
  drawTextStraight(tractContext, Mouthbook.n * 0.18, 3, "  tongue control");
  tractContext.textAlign = "left";
  drawText(tractContext, Mouthbook.n * 1.03, -1.07, "nasals");
  drawText(tractContext, Mouthbook.n * 1.03, -0.28, "stops");
  drawText(tractContext, Mouthbook.n * 1.03, 0.51, "fricatives");
  tractContext.strokeStyle = "orchid";
  tractContext.lineWidth = 2;
  tractContext.beginPath();
  moveMouthfleshTo(mouth, tractContext, Mouthbook.n * 1.03, 0);
  lineMouthfleshTo(mouth, tractContext, Mouthbook.n * 1.07, 0);
  moveMouthfleshTo(
    mouth,
    tractContext,
    Mouthbook.n * 1.03,
    -Settings.mouthflesh.noseOffset,
  );
  lineMouthfleshTo(
    mouth,
    tractContext,
    Mouthbook.n * 1.07,
    -Settings.mouthflesh.noseOffset,
  );
  tractContext.stroke();
  tractContext.globalAlpha = 0.9;
  tractContext.globalAlpha = 1.0;
  tractContext = tractContext;
};

const moveMouthfleshTo = (
  mouth: Mouth,
  context: CanvasRenderingContext2D,
  index: number,
  diameter: number,
): void => {
  let angle =
    Settings.mouthflesh.angleOffset +
    (index * Settings.mouthflesh.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);

  let wobble =
    mouth.maxAmplitude[Mouthbook.n - 1] +
    mouth.nose.maxAmplitude[Mouthbook.noseLength - 1];

  wobble *=
    (0.03 * Math.sin(2 * index - 50 * (performance.now() / 1000)) * index) /
    Mouthbook.n;
  angle += wobble;

  const r =
    Settings.mouthflesh.radius -
    Settings.mouthflesh.scale * diameter +
    100 * wobble;

  context.moveTo(
    Settings.mouthflesh.originX - r * Math.cos(angle),
    Settings.mouthflesh.originY - r * Math.sin(angle),
  );
};

const lineMouthfleshTo = (
  mouth: Mouth,
  context: CanvasRenderingContext2D,
  index: number,
  diameter: number,
): void => {
  let angle =
    Settings.mouthflesh.angleOffset +
    (index * Settings.mouthflesh.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);

  let wobble =
    mouth.maxAmplitude[Mouthbook.n - 1] +
    mouth.nose.maxAmplitude[Mouthbook.noseLength - 1];

  wobble *=
    (0.03 * Math.sin(2 * index - 50 * (performance.now() / 1000)) * index) /
    Mouthbook.n;
  angle += wobble;

  const r =
    Settings.mouthflesh.radius -
    Settings.mouthflesh.scale * diameter +
    100 * wobble;

  context.lineTo(
    Settings.mouthflesh.originX - r * Math.cos(angle),
    Settings.mouthflesh.originY - r * Math.sin(angle),
  );
};

const drawText = (
  context: CanvasRenderingContext2D,
  i: number,
  d: number,
  text: string,
): void => {
  const angle =
    Settings.mouthflesh.angleOffset +
    (i * Settings.mouthflesh.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = Settings.mouthflesh.radius - Settings.mouthflesh.scale * d;

  context.save();
  context.translate(
    Settings.mouthflesh.originX - r * Math.cos(angle),
    Settings.mouthflesh.originY - r * Math.sin(angle) + 2,
  );
  context.rotate(angle - Math.PI / 2);
  context.fillText(text, 0, 0);
  context.restore();
};

const drawTongueControl = (
  mouthflesh: Mouthflesh,
  mouth: Mouth,
  context: CanvasRenderingContext2D,
) => {
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = palePink;
  context.fillStyle = palePink;
  context.globalAlpha = 1.0;
  context.beginPath();
  context.lineWidth = 45;

  //outline
  moveMouthfleshTo(
    mouth,
    context,
    tongueLowerBound(),
    Settings.mouthflesh.innerTongueControlRadius,
  );
  for (let i = tongueLowerBound() + 1; i <= tongueUpperBound(); i++)
    lineMouthfleshTo(
      mouth,
      context,
      i,
      Settings.mouthflesh.innerTongueControlRadius,
    );
  lineMouthfleshTo(
    mouth,
    context,
    tongueMiddle(),
    Settings.mouthflesh.outerTongueControlRadius,
  );
  context.closePath();
  context.stroke();
  context.fill();

  const a = Settings.mouthflesh.innerTongueControlRadius;
  const c = Settings.mouthflesh.outerTongueControlRadius;
  const b = 0.5 * (a + c);
  const r = 3;
  context.fillStyle = "orchid";
  context.globalAlpha = 0.3;
  drawCircle(context, tongueMiddle(), a, r);
  drawCircle(context, tongueMiddle() - 4.25, a, r);
  drawCircle(context, tongueMiddle() - 8.5, a, r);
  drawCircle(context, tongueMiddle() + 4.25, a, r);
  drawCircle(context, tongueMiddle() + 8.5, a, r);
  drawCircle(context, tongueMiddle() - 6.1, b, r);
  drawCircle(context, tongueMiddle() + 6.1, b, r);
  drawCircle(context, tongueMiddle(), b, r);
  drawCircle(context, tongueMiddle(), c, r);

  context.globalAlpha = 1.0;

  //circle for tongue position
  const { x, y } = tongueToCanvas(
    mouthflesh.tongueBerth,
    mouthflesh.tongueWidth,
  );
  context.lineWidth = 4;
  context.strokeStyle = "orchid";
  context.globalAlpha = 0.7;
  context.beginPath();
  context.arc(x, y, 18, 0, 2 * Math.PI);
  context.stroke();
  context.globalAlpha = 0.15;
  context.fill();
  context.globalAlpha = 1.0;

  context.fillStyle = "orchid";
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
      : ((wobbleSettings.mouth.maxAmplitude[Mouthbook.n - 1] +
          wobbleSettings.mouth.nose.maxAmplitude[Mouthbook.noseLength - 1]) *
          (0.03 *
            Math.sin(2 * berth - 50 * (performance.now() / 1000)) *
            berth)) /
        Mouthbook.n;
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

export const drawMouthflesh = (
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
  mouth: Mouth,
  throat: Throat,
  ui: Flesh,
) => {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  drawTongueControl(mouthflesh, mouth, context);
  drawPitchControl(context, throat);

  const velum = mouth.nose.width[0];
  const velumAngle = velum * 4;

  //first draw fill
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = Settings.mouthflesh.fillColour;
  context.fillStyle = Settings.mouthflesh.fillColour;
  moveMouthfleshTo(mouth, context, 1, 0);
  for (let i = 1; i < Mouthbook.n; i++)
    lineMouthfleshTo(mouth, context, i, mouth.width[i].now);
  for (let i = Mouthbook.n - 1; i >= 2; i--)
    lineMouthfleshTo(mouth, context, i, 0);
  context.closePath();
  context.stroke();
  context.fill();

  //for nose
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = Settings.mouthflesh.fillColour;
  context.fillStyle = Settings.mouthflesh.fillColour;
  moveMouthfleshTo(
    mouth,
    context,
    Mouthbook.noseStart,
    -Settings.mouthflesh.noseOffset,
  );
  for (let i = 1; i < Mouthbook.noseLength; i++)
    lineMouthfleshTo(
      mouth,
      context,
      i + Mouthbook.noseStart,
      -Settings.mouthflesh.noseOffset - mouth.nose.width[i] * 0.9,
    );
  for (let i = Mouthbook.noseLength - 1; i >= 1; i--)
    lineMouthfleshTo(
      mouth,
      context,
      i + Mouthbook.noseStart,
      -Settings.mouthflesh.noseOffset,
    );
  context.closePath();
  context.fill();

  //velum
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = Settings.mouthflesh.fillColour;
  context.fillStyle = Settings.mouthflesh.fillColour;
  moveMouthfleshTo(mouth, context, Mouthbook.noseStart - 2, 0);
  lineMouthfleshTo(
    mouth,
    context,
    Mouthbook.noseStart,
    -Settings.mouthflesh.noseOffset,
  );
  lineMouthfleshTo(
    mouth,
    context,
    Mouthbook.noseStart + velumAngle,
    -Settings.mouthflesh.noseOffset,
  );
  lineMouthfleshTo(mouth, context, Mouthbook.noseStart + velumAngle - 2, 0);
  context.closePath();
  context.stroke();
  context.fill();

  //white text
  context.fillStyle = "white";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.globalAlpha = 1.0;
  drawText(context, Mouthbook.n * 0.1, 0.425, "throat");
  drawText(context, Mouthbook.n * 0.71, -1.8, "nasal");
  drawText(context, Mouthbook.n * 0.71, -1.3, "cavity");
  context.font = "22px Arial";
  drawText(context, Mouthbook.n * 0.6, 0.9, "oral");
  drawText(context, Mouthbook.n * 0.7, 0.9, "cavity");

  drawAmplitudes(mouth, context);

  //then draw lines
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = Settings.mouthflesh.lineColour;
  context.lineJoin = "round";
  context.lineCap = "round";
  moveMouthfleshTo(mouth, context, 1, mouth.width[0].now);
  for (let i = 2; i < Mouthbook.n; i++)
    lineMouthfleshTo(mouth, context, i, mouth.width[i].now);
  moveMouthfleshTo(mouth, context, 1, 0);
  for (let i = 2; i <= Mouthbook.noseStart - 2; i++)
    lineMouthfleshTo(mouth, context, i, 0);
  moveMouthfleshTo(mouth, context, Mouthbook.noseStart + velumAngle - 2, 0);
  for (
    let i = Mouthbook.noseStart + Math.ceil(velumAngle) - 2;
    i < Mouthbook.n;
    i++
  )
    lineMouthfleshTo(mouth, context, i, 0);
  context.stroke();

  //for nose
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = Settings.mouthflesh.lineColour;
  context.lineJoin = "round";
  moveMouthfleshTo(
    mouth,
    context,
    Mouthbook.noseStart,
    -Settings.mouthflesh.noseOffset,
  );
  for (let i = 1; i < Mouthbook.noseLength; i++)
    lineMouthfleshTo(
      mouth,
      context,
      i + Mouthbook.noseStart,
      -Settings.mouthflesh.noseOffset - mouth.nose.width[i] * 0.9,
    );
  moveMouthfleshTo(
    mouth,
    context,
    Mouthbook.noseStart + velumAngle,
    -Settings.mouthflesh.noseOffset,
  );
  for (let i = Math.ceil(velumAngle); i < Mouthbook.noseLength; i++)
    lineMouthfleshTo(
      mouth,
      context,
      i + Mouthbook.noseStart,
      -Settings.mouthflesh.noseOffset,
    );
  context.stroke();

  //velum
  context.globalAlpha = velum * 5;
  context.beginPath();
  moveMouthfleshTo(mouth, context, Mouthbook.noseStart - 2, 0);
  lineMouthfleshTo(
    mouth,
    context,
    Mouthbook.noseStart,
    -Settings.mouthflesh.noseOffset,
  );
  moveMouthfleshTo(mouth, context, Mouthbook.noseStart + velumAngle - 2, 0);
  lineMouthfleshTo(
    mouth,
    context,
    Mouthbook.noseStart + velumAngle,
    -Settings.mouthflesh.noseOffset,
  );
  context.stroke();

  context.fillStyle = "orchid";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.globalAlpha = 0.7;
  drawText(
    context,
    Mouthbook.n * 0.95,
    0.8 + 0.8 * mouth.width[Mouthbook.n - 1].now,
    " lip",
  );
};

export const handleMouthfleshTouches = (
  mouth: Mouth,
  flesh: Flesh,
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
) => {
  // kill dead rine
  if (!mouthflesh.tongueRine?.isAlive) {
    console.log("kill dead rine");
    mouthflesh.tongueRine = undefined;
  }

  if (mouthflesh.tongueRine === undefined) {
    console.log("rine not on tongue");
    for (let j = 0; j < flesh.mouserines.length; j++) {
      const rine = flesh.mouserines[j];

      if (!rine.isAlive) {
        continue;
      }
      if (rine.fricativeIntensity == 1) {
        continue; //only new touches will pass tractUi
      }

      const { berth, width } = canvasToTongue(rine);

      // touch is in tongue control area
      if (
        berth >= tongueLowerBound() - 4 &&
        berth <= tongueUpperBound() + 4 &&
        width >= Settings.mouthflesh.innerTongueControlRadius - 0.5 &&
        width <= Settings.mouthflesh.outerTongueControlRadius + 0.5
      ) {
        mouthflesh.tongueRine = rine;
      }
    }
  } else {
    // we're on the trapezoid
    console.log("rine on tongue");
    const { berth, width } = canvasToTongue(mouthflesh.tongueRine);
    let fromPoint = clamp(
      (Settings.mouthflesh.outerTongueControlRadius - width) /
        (Settings.mouthflesh.outerTongueControlRadius -
          Settings.mouthflesh.innerTongueControlRadius),
      0,
      1,
    );

    //horrible kludge to fit curve to straight line
    fromPoint =
      Math.pow(fromPoint, 0.58) - 0.2 * (fromPoint * fromPoint - fromPoint);
    mouthflesh.tongueWidth = clamp(
      width,
      Settings.mouthflesh.innerTongueControlRadius,
      Settings.mouthflesh.outerTongueControlRadius,
    );

    const out = fromPoint * 0.5 * (tongueUpperBound() - tongueLowerBound());
    mouthflesh.tongueBerth = clamp(
      berth,
      tongueMiddle() - out,
      tongueMiddle() + out,
    );
  }

  setRestWidth(mouth, mouthflesh);
  for (let i = 0; i < Mouthbook.n; i++)
    mouth.width[i].goal = mouth.width[i].rest;

  //other constrictions and nose
  mouth.velumTarget = 0.01;
  for (let j = 0; j < flesh.mouserines.length; j++) {
    const rine = flesh.mouserines[j];
    if (!rine.isAlive) {
      continue;
    }
    const { berth, width: rawWidth } = canvasToTongue(rine);
    if (
      berth > Mouthbook.noseStart &&
      rawWidth < -Settings.mouthflesh.noseOffset
    ) {
      mouth.velumTarget = 0.4;
    }
    if (rawWidth < -0.85 - Settings.mouthflesh.noseOffset) {
      continue;
    }

    const diameter = Math.max(rawWidth - 0.3, 0);
    // uh oh name clash inc
    let width = 2;
    if (berth < 25) {
      width = 10;
    } else if (berth >= Mouthbook.tipStart) {
      width = 5;
    } else {
      width = 10 - (5 * (berth - 25)) / (Mouthbook.tipStart - 25);
    }
    if (
      berth >= 2 &&
      berth < Mouthbook.n &&
      rine.y < context.canvas.height &&
      diameter < 3
    ) {
      const intIndex = Math.round(berth);
      for (let i = -Math.ceil(width) - 1; i < width + 1; i++) {
        if (intIndex + i < 0 || intIndex + i >= Mouthbook.n) {
          continue;
        }
        const relativePosition = Math.abs(intIndex + i - berth) - 0.5;
        const shrink =
          relativePosition <= 0
            ? 0
            : relativePosition > width
              ? 1
              : 0.5 * (1 - Math.cos((Math.PI * relativePosition) / width));
        if (diameter < mouth.width[intIndex + i].goal) {
          mouth.width[intIndex + i].goal =
            diameter + (mouth.width[intIndex + i].goal - diameter) * shrink;
        }
      }
    }
  }
};
