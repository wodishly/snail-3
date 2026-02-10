import { type Mouth } from "./mouth";
import { type Throat } from "./throat";
import { type Rine, type UiType } from "./ui";
import { clamp, type Z } from "./help/math";
import {
  Mouthbook,
  palePink,
  Settings,
  tongueLowerBound,
  tongueMiddle,
  tongueUpperBound,
} from "./settings";
import type { Maybe } from "./help/type";

export type Mouthflesh = {
  tongueBerth: number;
  tongueWidth: number;
  tongueRine: Maybe<Rine>;
  mouth: Mouth;
};

export const makeMouthflesh = (mouth: Mouth): Mouthflesh => {
  return {
    tongueBerth: 12.9,
    tongueWidth: 2.43,
    tongueRine: undefined as Maybe<Rine>,
    mouth,
  };
};

export const initTractUi = (
  tractUi: Mouthflesh,
  backContext: CanvasRenderingContext2D,
  tractContext: CanvasRenderingContext2D,
) => {
  setRestWidth(tractUi);
  for (var i = 0; i < Mouthbook.n; i++) {
    tractUi.mouth.width[i].now = tractUi.mouth.width[i].goal =
      tractUi.mouth.width[i].rest;
  }
  drawBackground(tractUi, backContext, tractContext);
};

export const getIndex = ({ x, y }: Z) => {
  let winkle = Math.atan2(
    y - Settings.ui.mouthUi.originY,
    x - Settings.ui.mouthUi.originX,
  );
  while (winkle > 0) {
    winkle -= 2 * Math.PI;
  }

  return (
    ((Math.PI + winkle - Settings.ui.mouthUi.angleOffset) *
      (Mouthbook.lipStart - 1)) /
    (Settings.ui.mouthUi.angleScale * Math.PI)
  );
};

export const getDiameter = ({ x, y }: Z) => {
  const offsetX = x - Settings.ui.mouthUi.originX;
  const offsetY = y - Settings.ui.mouthUi.originY;

  const length = Math.sqrt(offsetX ** 2 + offsetY ** 2);

  return (Settings.ui.mouthUi.radius - length) / Settings.ui.mouthUi.scale;
};

export const drawCircle = (
  context: CanvasRenderingContext2D,
  i: number,
  d: number,
  halfwidth: number,
) => {
  const angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d;
  context.beginPath();
  context.arc(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle),
    halfwidth,
    0,
    2 * Math.PI,
  );
  context.fill();
};

export const drawAmplitudes = (
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
) => {
  context.strokeStyle = "orchid";
  context.lineCap = "butt";
  context.globalAlpha = 0.3;
  for (let i = 2; i < Mouthbook.n - 1; i++) {
    context.beginPath();
    context.lineWidth = Math.sqrt(mouthflesh.mouth.maxAmplitude[i]) * 3;
    moveMouthfleshTo(mouthflesh, context, i, 0);
    lineMouthfleshTo(mouthflesh, context, i, mouthflesh.mouth.width[i].now);
    context.stroke();
  }
  for (let i = 1; i < Mouthbook.noseLength - 1; i++) {
    context.beginPath();
    context.lineWidth = Math.sqrt(mouthflesh.mouth.nose.maxAmplitude[i]) * 3;
    moveMouthfleshTo(
      mouthflesh,
      context,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset,
    );
    lineMouthfleshTo(
      mouthflesh,
      context,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset - mouthflesh.mouth.nose.width[i] * 0.9,
    );
    context.stroke();
  }
  context.globalAlpha = 1;
};

export const setRestWidth = (mouthflesh: Mouthflesh) => {
  for (let i = Mouthbook.bladeStart; i < Mouthbook.lipStart; i++) {
    const t =
      (1.1 * Math.PI * (mouthflesh.tongueBerth - i)) /
      (Mouthbook.tipStart - Mouthbook.bladeStart);
    const fixedTongueDiameter = 2 + (mouthflesh.tongueWidth - 2) / 1.5;
    let curve =
      (1.5 - fixedTongueDiameter + Settings.ui.mouthUi.gridOffset) *
      Math.cos(t);
    if (i == Mouthbook.bladeStart - 2 || i == Mouthbook.lipStart - 1) {
      curve *= 0.8;
    }
    if (i == Mouthbook.bladeStart || i == Mouthbook.lipStart - 2) {
      curve *= 0.94;
    }
    mouthflesh.mouth.width[i].rest = 1.5 - curve;
  }
};

export const drawPitchControl = (
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

export const drawTextStraight = (
  context: CanvasRenderingContext2D,
  i: number,
  d: number,
  text: string,
) => {
  const angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d;
  context.save();
  context.translate(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle) + 2,
  );
  context.fillText(text, 0, 0);
  context.restore();
};

export const drawBackground = (
  mouthflesh: Mouthflesh,
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
  moveMouthfleshTo(mouthflesh, tractContext, Mouthbook.n * 1.03, 0);
  lineMouthfleshTo(mouthflesh, tractContext, Mouthbook.n * 1.07, 0);
  moveMouthfleshTo(
    mouthflesh,
    tractContext,
    Mouthbook.n * 1.03,
    -Settings.ui.mouthUi.noseOffset,
  );
  lineMouthfleshTo(
    mouthflesh,
    tractContext,
    Mouthbook.n * 1.07,
    -Settings.ui.mouthUi.noseOffset,
  );
  tractContext.stroke();
  tractContext.globalAlpha = 0.9;
  tractContext.globalAlpha = 1.0;
  tractContext = tractContext;
};

export const moveMouthfleshTo = (
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
  i: number,
  d: number,
): void => {
  let angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);

  let wobble =
    mouthflesh.mouth.maxAmplitude[Mouthbook.n - 1] +
    mouthflesh.mouth.nose.maxAmplitude[Mouthbook.noseLength - 1];

  wobble *=
    (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
    Mouthbook.n;
  angle += wobble;

  const r =
    Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d + 100 * wobble;

  context.moveTo(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle),
  );
};

export const lineMouthfleshTo = (
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
  i: number,
  d: number,
): void => {
  let angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);

  let wobble =
    mouthflesh.mouth.maxAmplitude[Mouthbook.n - 1] +
    mouthflesh.mouth.nose.maxAmplitude[Mouthbook.noseLength - 1];

  wobble *=
    (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
    Mouthbook.n;
  angle += wobble;

  const r =
    Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d + 100 * wobble;

  context.lineTo(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle),
  );
};

export const drawText = (
  context: CanvasRenderingContext2D,
  i: number,
  d: number,
  text: string,
): void => {
  const angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d;

  context.save();
  context.translate(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle) + 2,
  );
  context.rotate(angle - Math.PI / 2);
  context.fillText(text, 0, 0);
  context.restore();
};

export const drawTongueControl = (
  mouthflesh: Mouthflesh,
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
    mouthflesh,
    context,
    tongueLowerBound(),
    Settings.ui.mouthUi.innerTongueControlRadius,
  );
  for (var i = tongueLowerBound() + 1; i <= tongueUpperBound(); i++)
    lineMouthfleshTo(
      mouthflesh,
      context,
      i,
      Settings.ui.mouthUi.innerTongueControlRadius,
    );
  lineMouthfleshTo(
    mouthflesh,
    context,
    tongueMiddle(),
    Settings.ui.mouthUi.outerTongueControlRadius,
  );
  context.closePath();
  context.stroke();
  context.fill();

  var a = Settings.ui.mouthUi.innerTongueControlRadius;
  var c = Settings.ui.mouthUi.outerTongueControlRadius;
  var b = 0.5 * (a + c);
  var r = 3;
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
  var angle =
    Settings.ui.mouthUi.angleOffset +
    (mouthflesh.tongueBerth * Settings.ui.mouthUi.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);
  var r =
    Settings.ui.mouthUi.radius -
    Settings.ui.mouthUi.scale * mouthflesh.tongueWidth;
  var x = Settings.ui.mouthUi.originX - r * Math.cos(angle);
  var y = Settings.ui.mouthUi.originY - r * Math.sin(angle);
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

export const drawTractUi = (
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
  throat: Throat,
  ui: UiType,
) => {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  drawTongueControl(mouthflesh, context);
  drawPitchControl(context, throat);

  var velum = mouthflesh.mouth.nose.width[0];
  var velumAngle = velum * 4;

  //first draw fill
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = Settings.ui.mouthUi.fillColour;
  context.fillStyle = Settings.ui.mouthUi.fillColour;
  moveMouthfleshTo(mouthflesh, context, 1, 0);
  for (var i = 1; i < Mouthbook.n; i++)
    lineMouthfleshTo(mouthflesh, context, i, mouthflesh.mouth.width[i].now);
  for (var i = Mouthbook.n - 1; i >= 2; i--)
    lineMouthfleshTo(mouthflesh, context, i, 0);
  context.closePath();
  context.stroke();
  context.fill();

  //for nose
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = Settings.ui.mouthUi.fillColour;
  context.fillStyle = Settings.ui.mouthUi.fillColour;
  moveMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart,
    -Settings.ui.mouthUi.noseOffset,
  );
  for (var i = 1; i < Mouthbook.noseLength; i++)
    lineMouthfleshTo(
      mouthflesh,
      context,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset - mouthflesh.mouth.nose.width[i] * 0.9,
    );
  for (var i = Mouthbook.noseLength - 1; i >= 1; i--)
    lineMouthfleshTo(
      mouthflesh,
      context,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset,
    );
  context.closePath();
  //tractUi.ctx.stroke();
  context.fill();

  //velum
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = Settings.ui.mouthUi.fillColour;
  context.fillStyle = Settings.ui.mouthUi.fillColour;
  moveMouthfleshTo(mouthflesh, context, Mouthbook.noseStart - 2, 0);
  lineMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart,
    -Settings.ui.mouthUi.noseOffset,
  );
  lineMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart + velumAngle,
    -Settings.ui.mouthUi.noseOffset,
  );
  lineMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart + velumAngle - 2,
    0,
  );
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

  drawAmplitudes(mouthflesh, context);

  //then draw lines
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = Settings.ui.mouthUi.lineColour;
  context.lineJoin = "round";
  context.lineCap = "round";
  moveMouthfleshTo(mouthflesh, context, 1, mouthflesh.mouth.width[0].now);
  for (let i = 2; i < Mouthbook.n; i++)
    lineMouthfleshTo(mouthflesh, context, i, mouthflesh.mouth.width[i].now);
  moveMouthfleshTo(mouthflesh, context, 1, 0);
  for (let i = 2; i <= Mouthbook.noseStart - 2; i++)
    lineMouthfleshTo(mouthflesh, context, i, 0);
  moveMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart + velumAngle - 2,
    0,
  );
  for (
    let i = Mouthbook.noseStart + Math.ceil(velumAngle) - 2;
    i < Mouthbook.n;
    i++
  )
    lineMouthfleshTo(mouthflesh, context, i, 0);
  context.stroke();

  //for nose
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = Settings.ui.mouthUi.lineColour;
  context.lineJoin = "round";
  moveMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart,
    -Settings.ui.mouthUi.noseOffset,
  );
  for (var i = 1; i < Mouthbook.noseLength; i++)
    lineMouthfleshTo(
      mouthflesh,
      context,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset - mouthflesh.mouth.nose.width[i] * 0.9,
    );
  moveMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart + velumAngle,
    -Settings.ui.mouthUi.noseOffset,
  );
  for (let i = Math.ceil(velumAngle); i < Mouthbook.noseLength; i++)
    lineMouthfleshTo(
      mouthflesh,
      context,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset,
    );
  context.stroke();

  //velum
  context.globalAlpha = velum * 5;
  context.beginPath();
  moveMouthfleshTo(mouthflesh, context, Mouthbook.noseStart - 2, 0);
  lineMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart,
    -Settings.ui.mouthUi.noseOffset,
  );
  moveMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart + velumAngle - 2,
    0,
  );
  lineMouthfleshTo(
    mouthflesh,
    context,
    Mouthbook.noseStart + velumAngle,
    -Settings.ui.mouthUi.noseOffset,
  );
  context.stroke();

  context.fillStyle = "orchid";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.globalAlpha = 0.7;
  drawText(
    context,
    Mouthbook.n * 0.95,
    0.8 + 0.8 * mouthflesh.mouth.width[Mouthbook.n - 1].now,
    " lip",
  );

  context.globalAlpha = 1.0;
  context.fillStyle = "black";
  context.textAlign = "left";
  context.fillText(ui.debugText, 20, 20);
};

export const handleTractUiTouches = (
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
  flesh: UiType,
) => {
  if (mouthflesh.tongueRine !== undefined && !mouthflesh.tongueRine.isAlive) {
    mouthflesh.tongueRine = undefined;
  }

  if (mouthflesh.tongueRine === undefined) {
    for (let j = 0; j < flesh.touchesWithMouse.length; j++) {
      const touch = flesh.touchesWithMouse[j];

      if (!touch.isAlive) {
        continue;
      }
      if (touch.fricativeIntensity == 1) {
        continue; //only new touches will pass tractUi
      }

      const x = touch.x;
      const y = touch.y;
      const index = getIndex({ x, y });
      const diameter = getDiameter({ x, y });

      if (
        index >= tongueLowerBound() - 4 &&
        index <= tongueUpperBound() + 4 &&
        diameter >= Settings.ui.mouthUi.innerTongueControlRadius - 0.5 &&
        diameter <= Settings.ui.mouthUi.outerTongueControlRadius + 0.5
      ) {
        mouthflesh.tongueRine = touch;
      }
    }
  }

  if (mouthflesh.tongueRine !== undefined) {
    const x = mouthflesh.tongueRine.x;
    const y = mouthflesh.tongueRine.y;
    const index = getIndex({ x, y });
    const diameter = getDiameter({ x, y });
    let fromPoint =
      (Settings.ui.mouthUi.outerTongueControlRadius - diameter) /
      (Settings.ui.mouthUi.outerTongueControlRadius -
        Settings.ui.mouthUi.innerTongueControlRadius);
    fromPoint = clamp(fromPoint, 0, 1);
    fromPoint =
      Math.pow(fromPoint, 0.58) - 0.2 * (fromPoint * fromPoint - fromPoint); //horrible kludge to fit curve to straight line
    mouthflesh.tongueWidth = clamp(
      diameter,
      Settings.ui.mouthUi.innerTongueControlRadius,
      Settings.ui.mouthUi.outerTongueControlRadius,
    );
    const out = fromPoint * 0.5 * (tongueUpperBound() - tongueLowerBound());
    mouthflesh.tongueBerth = clamp(
      index,
      tongueMiddle() - out,
      tongueMiddle() + out,
    );
  }

  setRestWidth(mouthflesh);
  for (let i = 0; i < Mouthbook.n; i++)
    mouthflesh.mouth.width[i].goal = mouthflesh.mouth.width[i].rest;

  //other constrictions and nose
  mouthflesh.mouth.velumTarget = 0.01;
  for (let j = 0; j < flesh.touchesWithMouse.length; j++) {
    const touch = flesh.touchesWithMouse[j];
    if (!touch.isAlive) {
      continue;
    }
    const x = touch.x;
    const y = touch.y;
    const index = getIndex({ x, y });
    let diameter = getDiameter({ x, y });
    if (
      index > Mouthbook.noseStart &&
      diameter < -Settings.ui.mouthUi.noseOffset
    ) {
      mouthflesh.mouth.velumTarget = 0.4;
    }
    if (diameter < -0.85 - Settings.ui.mouthUi.noseOffset) {
      continue;
    }
    diameter -= 0.3;
    if (diameter < 0) {
      diameter = 0;
    }
    let width = 2;
    if (index < 25) {
      width = 10;
    } else if (index >= Mouthbook.tipStart) {
      width = 5;
    } else {
      width = 10 - (5 * (index - 25)) / (Mouthbook.tipStart - 25);
    }
    if (
      index >= 2 &&
      index < Mouthbook.n &&
      y < context.canvas.height &&
      diameter < 3
    ) {
      let intIndex = Math.round(index);
      for (var i = -Math.ceil(width) - 1; i < width + 1; i++) {
        if (intIndex + i < 0 || intIndex + i >= Mouthbook.n) {
          continue;
        }
        var relpos = intIndex + i - index;
        relpos = Math.abs(relpos) - 0.5;
        var shrink;
        if (relpos <= 0) {
          shrink = 0;
        } else if (relpos > width) {
          shrink = 1;
        } else {
          shrink = 0.5 * (1 - Math.cos((Math.PI * relpos) / width));
        }
        if (diameter < mouthflesh.mouth.width[intIndex + i].goal) {
          mouthflesh.mouth.width[intIndex + i].goal =
            diameter +
            (mouthflesh.mouth.width[intIndex + i].goal - diameter) * shrink;
        }
      }
    }
  }
};
