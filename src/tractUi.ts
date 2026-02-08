import { type TractType } from "./tract";
import { type Throat } from "./throat";
import { type Rine, type UiType } from "./ui";
import { clamp } from "./help/math";
import {
  Mouthbook,
  palePink,
  Settings,
  tongueLowerBound,
  tongueMiddle,
  tongueUpperBound,
} from "./settings";
import type { Maybe } from "./help/type";

export type TractUiType = ReturnType<typeof makeTractUi>;

export type Mouthflesh = {
  tongueBerth: number;
  tongueWidth: number;
  tongueRine: Maybe<Rine>;
  tract: TractType;
  context: CanvasRenderingContext2D;
};

export const makeTractUi = (
  tract: TractType,
  context: CanvasRenderingContext2D,
) => {
  return {
    tongueIndex: 12.9,
    tongueDiameter: 2.43,
    tongueTouch: undefined as Maybe<Rine>,
    tract,
    context,
  };
};

export const initTractUi = (
  tractUi: TractUiType,
  backContext: CanvasRenderingContext2D,
) => {
  setRestDiameter(tractUi);
  for (var i = 0; i < Mouthbook.n; i++) {
    tractUi.tract.diameter[i] = tractUi.tract.targetDiameter[i] =
      tractUi.tract.restDiameter[i];
  }
  drawBackground(tractUi, backContext, tractUi.context);
};

export const getIndex = (x: number, y: number) => {
  const xx = x - Settings.ui.mouthUi.originX;
  const yy = y - Settings.ui.mouthUi.originY;

  let angle = Math.atan2(yy, xx);
  while (angle > 0) {
    angle -= 2 * Math.PI;
  }

  return (
    ((Math.PI + angle - Settings.ui.mouthUi.angleOffset) *
      (Mouthbook.lipStart - 1)) /
    (Settings.ui.mouthUi.angleScale * Math.PI)
  );
};

export const getDiameter = (x: number, y: number) => {
  const xx = x - Settings.ui.mouthUi.originX;
  const yy = y - Settings.ui.mouthUi.originY;

  return (
    (Settings.ui.mouthUi.radius - Math.sqrt(xx * xx + yy * yy)) /
    Settings.ui.mouthUi.scale
  );
};

export const drawCircle = (
  tractUi: TractUiType,
  i: number,
  d: number,
  radius: number,
) => {
  const angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d;
  tractUi.context.beginPath();
  tractUi.context.arc(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle),
    radius,
    0,
    2 * Math.PI,
  );
  tractUi.context.fill();
};

export const drawAmplitudes = (tractUi: TractUiType) => {
  tractUi.context.strokeStyle = "orchid";
  tractUi.context.lineCap = "butt";
  tractUi.context.globalAlpha = 0.3;
  for (var i = 2; i < Mouthbook.n - 1; i++) {
    tractUi.context.beginPath();
    tractUi.context.lineWidth = Math.sqrt(tractUi.tract.maxAmplitude[i]) * 3;
    moveTractUiTo(tractUi, i, 0);
    lineTractUiTo(tractUi, i, tractUi.tract.diameter[i]);
    tractUi.context.stroke();
  }
  for (var i = 1; i < Mouthbook.noseLength - 1; i++) {
    tractUi.context.beginPath();
    tractUi.context.lineWidth =
      Math.sqrt(tractUi.tract.noseMaxAmplitude[i]) * 3;
    moveTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset,
    );
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset - tractUi.tract.noseDiameter[i] * 0.9,
    );
    tractUi.context.stroke();
  }
  tractUi.context.globalAlpha = 1;
};

export const setRestDiameter = (tractUi: TractUiType) => {
  for (var i = Mouthbook.bladeStart; i < Mouthbook.lipStart; i++) {
    var t =
      (1.1 * Math.PI * (tractUi.tongueIndex - i)) /
      (Mouthbook.tipStart - Mouthbook.bladeStart);
    var fixedTongueDiameter = 2 + (tractUi.tongueDiameter - 2) / 1.5;
    var curve =
      (1.5 - fixedTongueDiameter + Settings.ui.mouthUi.gridOffset) *
      Math.cos(t);
    if (i == Mouthbook.bladeStart - 2 || i == Mouthbook.lipStart - 1)
      curve *= 0.8;
    if (i == Mouthbook.bladeStart || i == Mouthbook.lipStart - 2) curve *= 0.94;
    tractUi.tract.restDiameter[i] = 1.5 - curve;
  }
};

export const drawPitchControl = (tractUi: TractUiType, glottis: Throat) => {
  const w = 9;
  const h = 15;
  if (glottis.z.x) {
    tractUi.context.lineWidth = 4;
    tractUi.context.strokeStyle = "orchid";
    tractUi.context.globalAlpha = 0.7;
    tractUi.context.beginPath();
    tractUi.context.moveTo(glottis.z.x - w, glottis.z.y - h);
    tractUi.context.lineTo(glottis.z.x + w, glottis.z.y - h);
    tractUi.context.lineTo(glottis.z.x + w, glottis.z.y + h);
    tractUi.context.lineTo(glottis.z.x - w, glottis.z.y + h);
    tractUi.context.closePath();
    tractUi.context.stroke();
    tractUi.context.globalAlpha = 0.15;
    tractUi.context.fill();
    tractUi.context.globalAlpha = 1.0;
  }
};

export const drawTextStraight = (
  tractUi: TractUiType,
  i: number,
  d: number,
  text: string,
) => {
  const angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d;
  tractUi.context.save();
  tractUi.context.translate(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle) + 2,
  );
  tractUi.context.fillText(text, 0, 0);
  tractUi.context.restore();
};

export const drawBackground = (
  tractUi: TractUiType,
  backContext: CanvasRenderingContext2D,
  tractContext: CanvasRenderingContext2D,
) => {
  tractUi.context = backContext;

  //text
  tractUi.context.fillStyle = "orchid";
  tractUi.context.font = "20px Arial";
  tractUi.context.textAlign = "center";
  tractUi.context.globalAlpha = 0.7;
  drawText(tractUi, Mouthbook.n * 0.44, -0.28, "soft");
  drawText(tractUi, Mouthbook.n * 0.51, -0.28, "palate");
  drawText(tractUi, Mouthbook.n * 0.77, -0.28, "hard");
  drawText(tractUi, Mouthbook.n * 0.84, -0.28, "palate");
  drawText(tractUi, Mouthbook.n * 0.95, -0.28, " lip");

  tractUi.context.font = "17px Arial";
  drawTextStraight(tractUi, Mouthbook.n * 0.18, 3, "  tongue control");
  tractUi.context.textAlign = "left";
  drawText(tractUi, Mouthbook.n * 1.03, -1.07, "nasals");
  drawText(tractUi, Mouthbook.n * 1.03, -0.28, "stops");
  drawText(tractUi, Mouthbook.n * 1.03, 0.51, "fricatives");
  tractUi.context.strokeStyle = "orchid";
  tractUi.context.lineWidth = 2;
  tractUi.context.beginPath();
  moveTractUiTo(tractUi, Mouthbook.n * 1.03, 0);
  lineTractUiTo(tractUi, Mouthbook.n * 1.07, 0);
  moveTractUiTo(tractUi, Mouthbook.n * 1.03, -Settings.ui.mouthUi.noseOffset);
  lineTractUiTo(tractUi, Mouthbook.n * 1.07, -Settings.ui.mouthUi.noseOffset);
  tractUi.context.stroke();
  tractUi.context.globalAlpha = 0.9;
  tractUi.context.globalAlpha = 1.0;
  tractUi.context = tractContext;
};

export const moveTractUiTo = (tractUi: TractUiType, i: number, d: number) => {
  let angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  let wobble =
    tractUi.tract.maxAmplitude[Mouthbook.n - 1] +
    tractUi.tract.noseMaxAmplitude[Mouthbook.noseLength - 1];
  wobble *=
    (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
    Mouthbook.n;
  angle += wobble;
  var r =
    Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d + 100 * wobble;
  tractUi.context.moveTo(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle),
  );
};

export const lineTractUiTo = (tractUi: TractUiType, i: number, d: number) => {
  let angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  let wobble =
    tractUi.tract.maxAmplitude[Mouthbook.n - 1] +
    tractUi.tract.noseMaxAmplitude[Mouthbook.noseLength - 1];
  wobble *=
    (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
    Mouthbook.n;
  angle += wobble;
  const r =
    Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d + 100 * wobble;
  tractUi.context.lineTo(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle),
  );
};

export const drawText = (
  tractUi: TractUiType,
  i: number,
  d: number,
  text: string,
) => {
  const angle =
    Settings.ui.mouthUi.angleOffset +
    (i * Settings.ui.mouthUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = Settings.ui.mouthUi.radius - Settings.ui.mouthUi.scale * d;
  tractUi.context.save();
  tractUi.context.translate(
    Settings.ui.mouthUi.originX - r * Math.cos(angle),
    Settings.ui.mouthUi.originY - r * Math.sin(angle) + 2,
  );
  tractUi.context.rotate(angle - Math.PI / 2);
  tractUi.context.fillText(text, 0, 0);
  tractUi.context.restore();
};

export const drawTongueControl = (tractUi: TractUiType) => {
  tractUi.context.lineCap = "round";
  tractUi.context.lineJoin = "round";
  tractUi.context.strokeStyle = palePink;
  tractUi.context.fillStyle = palePink;
  tractUi.context.globalAlpha = 1.0;
  tractUi.context.beginPath();
  tractUi.context.lineWidth = 45;

  //outline
  moveTractUiTo(
    tractUi,
    tongueLowerBound(),
    Settings.ui.mouthUi.innerTongueControlRadius,
  );
  for (var i = tongueLowerBound() + 1; i <= tongueUpperBound(); i++)
    lineTractUiTo(tractUi, i, Settings.ui.mouthUi.innerTongueControlRadius);
  lineTractUiTo(
    tractUi,
    tongueMiddle(),
    Settings.ui.mouthUi.outerTongueControlRadius,
  );
  tractUi.context.closePath();
  tractUi.context.stroke();
  tractUi.context.fill();

  var a = Settings.ui.mouthUi.innerTongueControlRadius;
  var c = Settings.ui.mouthUi.outerTongueControlRadius;
  var b = 0.5 * (a + c);
  var r = 3;
  tractUi.context.fillStyle = "orchid";
  tractUi.context.globalAlpha = 0.3;
  drawCircle(tractUi, tongueMiddle(), a, r);
  drawCircle(tractUi, tongueMiddle() - 4.25, a, r);
  drawCircle(tractUi, tongueMiddle() - 8.5, a, r);
  drawCircle(tractUi, tongueMiddle() + 4.25, a, r);
  drawCircle(tractUi, tongueMiddle() + 8.5, a, r);
  drawCircle(tractUi, tongueMiddle() - 6.1, b, r);
  drawCircle(tractUi, tongueMiddle() + 6.1, b, r);
  drawCircle(tractUi, tongueMiddle(), b, r);
  drawCircle(tractUi, tongueMiddle(), c, r);

  tractUi.context.globalAlpha = 1.0;

  //circle for tongue position
  var angle =
    Settings.ui.mouthUi.angleOffset +
    (tractUi.tongueIndex * Settings.ui.mouthUi.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);
  var r =
    Settings.ui.mouthUi.radius -
    Settings.ui.mouthUi.scale * tractUi.tongueDiameter;
  var x = Settings.ui.mouthUi.originX - r * Math.cos(angle);
  var y = Settings.ui.mouthUi.originY - r * Math.sin(angle);
  tractUi.context.lineWidth = 4;
  tractUi.context.strokeStyle = "orchid";
  tractUi.context.globalAlpha = 0.7;
  tractUi.context.beginPath();
  tractUi.context.arc(x, y, 18, 0, 2 * Math.PI);
  tractUi.context.stroke();
  tractUi.context.globalAlpha = 0.15;
  tractUi.context.fill();
  tractUi.context.globalAlpha = 1.0;

  tractUi.context.fillStyle = "orchid";
};

export const drawTractUi = (
  tractUi: TractUiType,
  glottis: Throat,
  ui: UiType,
  tractCtx: CanvasRenderingContext2D,
) => {
  tractUi.context.clearRect(
    0,
    0,
    tractCtx.canvas.width,
    tractCtx.canvas.height,
  );
  tractUi.context.lineCap = "round";
  tractUi.context.lineJoin = "round";

  drawTongueControl(tractUi);
  drawPitchControl(tractUi, glottis);

  var velum = tractUi.tract.noseDiameter[0];
  var velumAngle = velum * 4;

  //first draw fill
  tractUi.context.beginPath();
  tractUi.context.lineWidth = 2;
  tractUi.context.strokeStyle = Settings.ui.mouthUi.fillColour;
  tractUi.context.fillStyle = Settings.ui.mouthUi.fillColour;
  moveTractUiTo(tractUi, 1, 0);
  for (var i = 1; i < Mouthbook.n; i++)
    lineTractUiTo(tractUi, i, tractUi.tract.diameter[i]);
  for (var i = Mouthbook.n - 1; i >= 2; i--) lineTractUiTo(tractUi, i, 0);
  tractUi.context.closePath();
  tractUi.context.stroke();
  tractUi.context.fill();

  //for nose
  tractUi.context.beginPath();
  tractUi.context.lineWidth = 2;
  tractUi.context.strokeStyle = Settings.ui.mouthUi.fillColour;
  tractUi.context.fillStyle = Settings.ui.mouthUi.fillColour;
  moveTractUiTo(tractUi, Mouthbook.noseStart, -Settings.ui.mouthUi.noseOffset);
  for (var i = 1; i < Mouthbook.noseLength; i++)
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset - tractUi.tract.noseDiameter[i] * 0.9,
    );
  for (var i = Mouthbook.noseLength - 1; i >= 1; i--)
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset,
    );
  tractUi.context.closePath();
  //tractUi.ctx.stroke();
  tractUi.context.fill();

  //velum
  tractUi.context.beginPath();
  tractUi.context.lineWidth = 2;
  tractUi.context.strokeStyle = Settings.ui.mouthUi.fillColour;
  tractUi.context.fillStyle = Settings.ui.mouthUi.fillColour;
  moveTractUiTo(tractUi, Mouthbook.noseStart - 2, 0);
  lineTractUiTo(tractUi, Mouthbook.noseStart, -Settings.ui.mouthUi.noseOffset);
  lineTractUiTo(
    tractUi,
    Mouthbook.noseStart + velumAngle,
    -Settings.ui.mouthUi.noseOffset,
  );
  lineTractUiTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  tractUi.context.closePath();
  tractUi.context.stroke();
  tractUi.context.fill();

  //white text
  tractUi.context.fillStyle = "white";
  tractUi.context.font = "20px Arial";
  tractUi.context.textAlign = "center";
  tractUi.context.globalAlpha = 1.0;
  drawText(tractUi, Mouthbook.n * 0.1, 0.425, "throat");
  drawText(tractUi, Mouthbook.n * 0.71, -1.8, "nasal");
  drawText(tractUi, Mouthbook.n * 0.71, -1.3, "cavity");
  tractUi.context.font = "22px Arial";
  drawText(tractUi, Mouthbook.n * 0.6, 0.9, "oral");
  drawText(tractUi, Mouthbook.n * 0.7, 0.9, "cavity");

  drawAmplitudes(tractUi);

  //then draw lines
  tractUi.context.beginPath();
  tractUi.context.lineWidth = 5;
  tractUi.context.strokeStyle = Settings.ui.mouthUi.lineColour;
  tractUi.context.lineJoin = "round";
  tractUi.context.lineCap = "round";
  moveTractUiTo(tractUi, 1, tractUi.tract.diameter[0]);
  for (let i = 2; i < Mouthbook.n; i++)
    lineTractUiTo(tractUi, i, tractUi.tract.diameter[i]);
  moveTractUiTo(tractUi, 1, 0);
  for (let i = 2; i <= Mouthbook.noseStart - 2; i++)
    lineTractUiTo(tractUi, i, 0);
  moveTractUiTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  for (
    let i = Mouthbook.noseStart + Math.ceil(velumAngle) - 2;
    i < Mouthbook.n;
    i++
  )
    lineTractUiTo(tractUi, i, 0);
  tractUi.context.stroke();

  //for nose
  tractUi.context.beginPath();
  tractUi.context.lineWidth = 5;
  tractUi.context.strokeStyle = Settings.ui.mouthUi.lineColour;
  tractUi.context.lineJoin = "round";
  moveTractUiTo(tractUi, Mouthbook.noseStart, -Settings.ui.mouthUi.noseOffset);
  for (var i = 1; i < Mouthbook.noseLength; i++)
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset - tractUi.tract.noseDiameter[i] * 0.9,
    );
  moveTractUiTo(
    tractUi,
    Mouthbook.noseStart + velumAngle,
    -Settings.ui.mouthUi.noseOffset,
  );
  for (let i = Math.ceil(velumAngle); i < Mouthbook.noseLength; i++)
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -Settings.ui.mouthUi.noseOffset,
    );
  tractUi.context.stroke();

  //velum
  tractUi.context.globalAlpha = velum * 5;
  tractUi.context.beginPath();
  moveTractUiTo(tractUi, Mouthbook.noseStart - 2, 0);
  lineTractUiTo(tractUi, Mouthbook.noseStart, -Settings.ui.mouthUi.noseOffset);
  moveTractUiTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  lineTractUiTo(
    tractUi,
    Mouthbook.noseStart + velumAngle,
    -Settings.ui.mouthUi.noseOffset,
  );
  tractUi.context.stroke();

  tractUi.context.fillStyle = "orchid";
  tractUi.context.font = "20px Arial";
  tractUi.context.textAlign = "center";
  tractUi.context.globalAlpha = 0.7;
  drawText(
    tractUi,
    Mouthbook.n * 0.95,
    0.8 + 0.8 * tractUi.tract.diameter[Mouthbook.n - 1],
    " lip",
  );

  tractUi.context.globalAlpha = 1.0;
  tractUi.context.fillStyle = "black";
  tractUi.context.textAlign = "left";
  tractUi.context.fillText(ui.debugText, 20, 20);
};

export const handleTractUiTouches = (tractUi: TractUiType, ui: UiType) => {
  if (tractUi.tongueTouch !== undefined && !tractUi.tongueTouch.isAlive) {
    tractUi.tongueTouch = undefined;
  }

  if (tractUi.tongueTouch === undefined) {
    for (let j = 0; j < ui.touchesWithMouse.length; j++) {
      const touch = ui.touchesWithMouse[j];

      if (!touch.isAlive) {
        continue;
      }
      if (touch.fricativeIntensity == 1) {
        continue; //only new touches will pass tractUi
      }

      const x = touch.x;
      const y = touch.y;
      const index = getIndex(x, y);
      const diameter = getDiameter(x, y);

      if (
        index >= tongueLowerBound() - 4 &&
        index <= tongueUpperBound() + 4 &&
        diameter >= Settings.ui.mouthUi.innerTongueControlRadius - 0.5 &&
        diameter <= Settings.ui.mouthUi.outerTongueControlRadius + 0.5
      ) {
        tractUi.tongueTouch = touch;
      }
    }
  }

  if (tractUi.tongueTouch !== undefined) {
    const x = tractUi.tongueTouch.x;
    const y = tractUi.tongueTouch.y;
    const index = getIndex(x, y);
    const diameter = getDiameter(x, y);
    let fromPoint =
      (Settings.ui.mouthUi.outerTongueControlRadius - diameter) /
      (Settings.ui.mouthUi.outerTongueControlRadius -
        Settings.ui.mouthUi.innerTongueControlRadius);
    fromPoint = clamp(fromPoint, 0, 1);
    fromPoint =
      Math.pow(fromPoint, 0.58) - 0.2 * (fromPoint * fromPoint - fromPoint); //horrible kludge to fit curve to straight line
    tractUi.tongueDiameter = clamp(
      diameter,
      Settings.ui.mouthUi.innerTongueControlRadius,
      Settings.ui.mouthUi.outerTongueControlRadius,
    );
    const out = fromPoint * 0.5 * (tongueUpperBound() - tongueLowerBound());
    tractUi.tongueIndex = clamp(
      index,
      tongueMiddle() - out,
      tongueMiddle() + out,
    );
  }

  setRestDiameter(tractUi);
  for (let i = 0; i < Mouthbook.n; i++)
    tractUi.tract.targetDiameter[i] = tractUi.tract.restDiameter[i];

  //other constrictions and nose
  tractUi.tract.velumTarget = 0.01;
  for (let j = 0; j < ui.touchesWithMouse.length; j++) {
    const touch = ui.touchesWithMouse[j];
    if (!touch.isAlive) {
      continue;
    }
    const x = touch.x;
    const y = touch.y;
    const index = getIndex(x, y);
    let diameter = getDiameter(x, y);
    if (
      index > Mouthbook.noseStart &&
      diameter < -Settings.ui.mouthUi.noseOffset
    ) {
      tractUi.tract.velumTarget = 0.4;
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
      y < tractUi.context.canvas.height &&
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
        if (diameter < tractUi.tract.targetDiameter[intIndex + i]) {
          tractUi.tract.targetDiameter[intIndex + i] =
            diameter +
            (tractUi.tract.targetDiameter[intIndex + i] - diameter) * shrink;
        }
      }
    }
  }
};
