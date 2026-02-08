import { Tract } from "./gract";
import { type Throat } from "./grottis";
import { type UiType } from "./grui";
import { clamp, type Z } from "./math";
import { Mouthbook, palePink } from "./settings";

export type TractUiType = typeof TractUI;

export var TractUI = {
  originX: 340,
  originY: 449,
  radius: 298,
  scale: 60,
  tongueIndex: 12.9,
  tongueDiameter: 2.43,
  innerTongueControlRadius: 2.05,
  outerTongueControlRadius: 3.5,
  tongueTouch: 0,
  angleScale: 0.64,
  angleOffset: -0.24,
  noseOffset: 0.8,
  gridOffset: 1.7,
  fillColour: "pink",
  lineColour: "#C070C6",
};

export const initTractUi = (
  tractUi: TractUiType,
  backContext: CanvasRenderingContext2D,
  tractContext: CanvasRenderingContext2D,
) => {
  tractUi.ctx = tractContext;
  setRestDiameter(tractUi);
  for (var i = 0; i < Mouthbook.n; i++) {
    Tract.diameter[i] = Tract.targetDiameter[i] = Tract.restDiameter[i];
  }
  drawBackground(tractUi, backContext, tractContext);
  tractUi.tongueLowerIndexBound = Mouthbook.bladeStart + 2;
  tractUi.tongueUpperIndexBound = Mouthbook.tipStart - 3;
  tractUi.tongueIndexCentre =
    0.5 * (tractUi.tongueLowerIndexBound + tractUi.tongueUpperIndexBound);
};

export const getIndex = (tractUi: TractUiType, x: number, y: number) => {
  const xx = x - tractUi.originX;
  const yy = y - tractUi.originY;

  let angle = Math.atan2(yy, xx);
  while (angle > 0) {
    angle -= 2 * Math.PI;
  }

  return (
    ((Math.PI + angle - tractUi.angleOffset) * (Mouthbook.lipStart - 1)) /
    (tractUi.angleScale * Math.PI)
  );
};

export const getDiameter = (tractUi: TractUiType, x: number, y: number) => {
  const xx = x - tractUi.originX;
  const yy = y - tractUi.originY;

  return (tractUi.radius - Math.sqrt(xx * xx + yy * yy)) / tractUi.scale;
};

export const drawCircle = (
  tractUi: TractUiType,
  i: number,
  d: number,
  radius: number,
) => {
  const angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = tractUi.radius - tractUi.scale * d;
  tractUi.ctx.beginPath();
  tractUi.ctx.arc(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle),
    radius,
    0,
    2 * Math.PI,
  );
  tractUi.ctx.fill();
};

export const drawAmplitudes = (tractUi: TractUiType) => {
  tractUi.ctx.strokeStyle = "orchid";
  tractUi.ctx.lineCap = "butt";
  tractUi.ctx.globalAlpha = 0.3;
  for (var i = 2; i < Mouthbook.n - 1; i++) {
    tractUi.ctx.beginPath();
    tractUi.ctx.lineWidth = Math.sqrt(Tract.maxAmplitude[i]) * 3;
    moveTractUiTo(tractUi, i, 0);
    lineTractUiTo(tractUi, i, Tract.diameter[i]);
    tractUi.ctx.stroke();
  }
  for (var i = 1; i < Mouthbook.noseLength - 1; i++) {
    tractUi.ctx.beginPath();
    tractUi.ctx.lineWidth = Math.sqrt(Tract.noseMaxAmplitude[i]) * 3;
    moveTractUiTo(tractUi, i + Mouthbook.noseStart, -tractUi.noseOffset);
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -tractUi.noseOffset - Tract.noseDiameter[i] * 0.9,
    );
    tractUi.ctx.stroke();
  }
  tractUi.ctx.globalAlpha = 1;
};

export const setRestDiameter = (tractUi: TractUiType) => {
  for (var i = Mouthbook.bladeStart; i < Mouthbook.lipStart; i++) {
    var t =
      (1.1 * Math.PI * (tractUi.tongueIndex - i)) /
      (Mouthbook.tipStart - Mouthbook.bladeStart);
    var fixedTongueDiameter = 2 + (tractUi.tongueDiameter - 2) / 1.5;
    var curve = (1.5 - fixedTongueDiameter + tractUi.gridOffset) * Math.cos(t);
    if (i == Mouthbook.bladeStart - 2 || i == Mouthbook.lipStart - 1)
      curve *= 0.8;
    if (i == Mouthbook.bladeStart || i == Mouthbook.lipStart - 2) curve *= 0.94;
    Tract.restDiameter[i] = 1.5 - curve;
  }
};

export const drawPitchControl = (tractUi: TractUiType, glottis: Throat) => {
  const w = 9;
  const h = 15;
  if (glottis.z.x) {
    tractUi.ctx.lineWidth = 4;
    tractUi.ctx.strokeStyle = "orchid";
    tractUi.ctx.globalAlpha = 0.7;
    tractUi.ctx.beginPath();
    tractUi.ctx.moveTo(glottis.z.x - w, glottis.z.y - h);
    tractUi.ctx.lineTo(glottis.z.x + w, glottis.z.y - h);
    tractUi.ctx.lineTo(glottis.z.x + w, glottis.z.y + h);
    tractUi.ctx.lineTo(glottis.z.x - w, glottis.z.y + h);
    tractUi.ctx.closePath();
    tractUi.ctx.stroke();
    tractUi.ctx.globalAlpha = 0.15;
    tractUi.ctx.fill();
    tractUi.ctx.globalAlpha = 1.0;
  }
};

export const drawTextStraight = (
  tractUi: TractUiType,
  i: number,
  d: number,
  text: string,
) => {
  const angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = tractUi.radius - tractUi.scale * d;
  tractUi.ctx.save();
  tractUi.ctx.translate(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle) + 2,
  );
  tractUi.ctx.fillText(text, 0, 0);
  tractUi.ctx.restore();
};

export const drawBackground = (
  tractUi: TractUiType,
  backContext: CanvasRenderingContext2D,
  tractContext: CanvasRenderingContext2D,
) => {
  tractUi.ctx = backContext;

  //text
  tractUi.ctx.fillStyle = "orchid";
  tractUi.ctx.font = "20px Arial";
  tractUi.ctx.textAlign = "center";
  tractUi.ctx.globalAlpha = 0.7;
  drawText(tractUi, Mouthbook.n * 0.44, -0.28, "soft");
  drawText(tractUi, Mouthbook.n * 0.51, -0.28, "palate");
  drawText(tractUi, Mouthbook.n * 0.77, -0.28, "hard");
  drawText(tractUi, Mouthbook.n * 0.84, -0.28, "palate");
  drawText(tractUi, Mouthbook.n * 0.95, -0.28, " lip");

  tractUi.ctx.font = "17px Arial";
  drawTextStraight(tractUi, Mouthbook.n * 0.18, 3, "  tongue control");
  tractUi.ctx.textAlign = "left";
  drawText(tractUi, Mouthbook.n * 1.03, -1.07, "nasals");
  drawText(tractUi, Mouthbook.n * 1.03, -0.28, "stops");
  drawText(tractUi, Mouthbook.n * 1.03, 0.51, "fricatives");
  tractUi.ctx.strokeStyle = "orchid";
  tractUi.ctx.lineWidth = 2;
  tractUi.ctx.beginPath();
  moveTractUiTo(tractUi, Mouthbook.n * 1.03, 0);
  lineTractUiTo(tractUi, Mouthbook.n * 1.07, 0);
  moveTractUiTo(tractUi, Mouthbook.n * 1.03, -tractUi.noseOffset);
  lineTractUiTo(tractUi, Mouthbook.n * 1.07, -tractUi.noseOffset);
  tractUi.ctx.stroke();
  tractUi.ctx.globalAlpha = 0.9;
  tractUi.ctx.globalAlpha = 1.0;
  tractUi.ctx = tractContext;
};

export const moveTractUiTo = (tractUi: TractUiType, i: number, d: number) => {
  let angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  let wobble =
    Tract.maxAmplitude[Mouthbook.n - 1] +
    Tract.noseMaxAmplitude[Mouthbook.noseLength - 1];
  wobble *=
    (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
    Mouthbook.n;
  angle += wobble;
  var r = tractUi.radius - tractUi.scale * d + 100 * wobble;
  tractUi.ctx.moveTo(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle),
  );
};

export const lineTractUiTo = (tractUi: TractUiType, i: number, d: number) => {
  let angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  let wobble =
    Tract.maxAmplitude[Mouthbook.n - 1] +
    Tract.noseMaxAmplitude[Mouthbook.noseLength - 1];
  wobble *=
    (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
    Mouthbook.n;
  angle += wobble;
  const r = tractUi.radius - tractUi.scale * d + 100 * wobble;
  tractUi.ctx.lineTo(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle),
  );
};

export const drawText = (
  tractUi: TractUiType,
  i: number,
  d: number,
  text: string,
) => {
  const angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = tractUi.radius - tractUi.scale * d;
  tractUi.ctx.save();
  tractUi.ctx.translate(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle) + 2,
  );
  tractUi.ctx.rotate(angle - Math.PI / 2);
  tractUi.ctx.fillText(text, 0, 0);
  tractUi.ctx.restore();
};

export const drawTongueControl = (tractUi: TractUiType) => {
  tractUi.ctx.lineCap = "round";
  tractUi.ctx.lineJoin = "round";
  tractUi.ctx.strokeStyle = palePink;
  tractUi.ctx.fillStyle = palePink;
  tractUi.ctx.globalAlpha = 1.0;
  tractUi.ctx.beginPath();
  tractUi.ctx.lineWidth = 45;

  //outline
  moveTractUiTo(
    tractUi,
    tractUi.tongueLowerIndexBound,
    tractUi.innerTongueControlRadius,
  );
  for (
    var i = tractUi.tongueLowerIndexBound + 1;
    i <= tractUi.tongueUpperIndexBound;
    i++
  )
    lineTractUiTo(tractUi, i, tractUi.innerTongueControlRadius);
  lineTractUiTo(
    tractUi,
    tractUi.tongueIndexCentre,
    tractUi.outerTongueControlRadius,
  );
  tractUi.ctx.closePath();
  tractUi.ctx.stroke();
  tractUi.ctx.fill();

  var a = tractUi.innerTongueControlRadius;
  var c = tractUi.outerTongueControlRadius;
  var b = 0.5 * (a + c);
  var r = 3;
  tractUi.ctx.fillStyle = "orchid";
  tractUi.ctx.globalAlpha = 0.3;
  drawCircle(tractUi, tractUi.tongueIndexCentre, a, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre - 4.25, a, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre - 8.5, a, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre + 4.25, a, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre + 8.5, a, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre - 6.1, b, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre + 6.1, b, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre, b, r);
  drawCircle(tractUi, tractUi.tongueIndexCentre, c, r);

  tractUi.ctx.globalAlpha = 1.0;

  //circle for tongue position
  var angle =
    tractUi.angleOffset +
    (tractUi.tongueIndex * tractUi.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);
  var r = tractUi.radius - tractUi.scale * tractUi.tongueDiameter;
  var x = tractUi.originX - r * Math.cos(angle);
  var y = tractUi.originY - r * Math.sin(angle);
  tractUi.ctx.lineWidth = 4;
  tractUi.ctx.strokeStyle = "orchid";
  tractUi.ctx.globalAlpha = 0.7;
  tractUi.ctx.beginPath();
  tractUi.ctx.arc(x, y, 18, 0, 2 * Math.PI);
  tractUi.ctx.stroke();
  tractUi.ctx.globalAlpha = 0.15;
  tractUi.ctx.fill();
  tractUi.ctx.globalAlpha = 1.0;

  tractUi.ctx.fillStyle = "orchid";
};

export const drawTractUi = (
  tractUi: TractUiType,
  glottis: Throat,
  ui: UiType,
  canvasSize: Z,
) => {
  tractUi.ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
  tractUi.ctx.lineCap = "round";
  tractUi.ctx.lineJoin = "round";

  drawTongueControl(tractUi);
  drawPitchControl(tractUi, glottis);

  var velum = Tract.noseDiameter[0];
  var velumAngle = velum * 4;

  //first draw fill
  tractUi.ctx.beginPath();
  tractUi.ctx.lineWidth = 2;
  tractUi.ctx.strokeStyle = tractUi.fillColour;
  tractUi.ctx.fillStyle = tractUi.fillColour;
  moveTractUiTo(tractUi, 1, 0);
  for (var i = 1; i < Mouthbook.n; i++)
    lineTractUiTo(tractUi, i, Tract.diameter[i]);
  for (var i = Mouthbook.n - 1; i >= 2; i--) lineTractUiTo(tractUi, i, 0);
  tractUi.ctx.closePath();
  tractUi.ctx.stroke();
  tractUi.ctx.fill();

  //for nose
  tractUi.ctx.beginPath();
  tractUi.ctx.lineWidth = 2;
  tractUi.ctx.strokeStyle = tractUi.fillColour;
  tractUi.ctx.fillStyle = tractUi.fillColour;
  moveTractUiTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  for (var i = 1; i < Mouthbook.noseLength; i++)
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -tractUi.noseOffset - Tract.noseDiameter[i] * 0.9,
    );
  for (var i = Mouthbook.noseLength - 1; i >= 1; i--)
    lineTractUiTo(tractUi, i + Mouthbook.noseStart, -tractUi.noseOffset);
  tractUi.ctx.closePath();
  //tractUi.ctx.stroke();
  tractUi.ctx.fill();

  //velum
  tractUi.ctx.beginPath();
  tractUi.ctx.lineWidth = 2;
  tractUi.ctx.strokeStyle = tractUi.fillColour;
  tractUi.ctx.fillStyle = tractUi.fillColour;
  moveTractUiTo(tractUi, Mouthbook.noseStart - 2, 0);
  lineTractUiTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  lineTractUiTo(tractUi, Mouthbook.noseStart + velumAngle, -tractUi.noseOffset);
  lineTractUiTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  tractUi.ctx.closePath();
  tractUi.ctx.stroke();
  tractUi.ctx.fill();

  //white text
  tractUi.ctx.fillStyle = "white";
  tractUi.ctx.font = "20px Arial";
  tractUi.ctx.textAlign = "center";
  tractUi.ctx.globalAlpha = 1.0;
  drawText(tractUi, Mouthbook.n * 0.1, 0.425, "throat");
  drawText(tractUi, Mouthbook.n * 0.71, -1.8, "nasal");
  drawText(tractUi, Mouthbook.n * 0.71, -1.3, "cavity");
  tractUi.ctx.font = "22px Arial";
  drawText(tractUi, Mouthbook.n * 0.6, 0.9, "oral");
  drawText(tractUi, Mouthbook.n * 0.7, 0.9, "cavity");

  drawAmplitudes(tractUi);

  //then draw lines
  tractUi.ctx.beginPath();
  tractUi.ctx.lineWidth = 5;
  tractUi.ctx.strokeStyle = tractUi.lineColour;
  tractUi.ctx.lineJoin = "round";
  tractUi.ctx.lineCap = "round";
  moveTractUiTo(tractUi, 1, Tract.diameter[0]);
  for (let i = 2; i < Mouthbook.n; i++)
    lineTractUiTo(tractUi, i, Tract.diameter[i]);
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
  tractUi.ctx.stroke();

  //for nose
  tractUi.ctx.beginPath();
  tractUi.ctx.lineWidth = 5;
  tractUi.ctx.strokeStyle = tractUi.lineColour;
  tractUi.ctx.lineJoin = "round";
  moveTractUiTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  for (var i = 1; i < Mouthbook.noseLength; i++)
    lineTractUiTo(
      tractUi,
      i + Mouthbook.noseStart,
      -tractUi.noseOffset - Tract.noseDiameter[i] * 0.9,
    );
  moveTractUiTo(tractUi, Mouthbook.noseStart + velumAngle, -tractUi.noseOffset);
  for (let i = Math.ceil(velumAngle); i < Mouthbook.noseLength; i++)
    lineTractUiTo(tractUi, i + Mouthbook.noseStart, -tractUi.noseOffset);
  tractUi.ctx.stroke();

  //velum
  tractUi.ctx.globalAlpha = velum * 5;
  tractUi.ctx.beginPath();
  moveTractUiTo(tractUi, Mouthbook.noseStart - 2, 0);
  lineTractUiTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  moveTractUiTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  lineTractUiTo(tractUi, Mouthbook.noseStart + velumAngle, -tractUi.noseOffset);
  tractUi.ctx.stroke();

  tractUi.ctx.fillStyle = "orchid";
  tractUi.ctx.font = "20px Arial";
  tractUi.ctx.textAlign = "center";
  tractUi.ctx.globalAlpha = 0.7;
  drawText(
    tractUi,
    Mouthbook.n * 0.95,
    0.8 + 0.8 * Tract.diameter[Mouthbook.n - 1],
    " lip",
  );

  tractUi.ctx.globalAlpha = 1.0;
  tractUi.ctx.fillStyle = "black";
  tractUi.ctx.textAlign = "left";
  tractUi.ctx.fillText(ui.debugText, 20, 20);
};

export const handleTractUiTouches = (tractUi: TractUiType, ui: UiType) => {
  if (tractUi.tongueTouch != 0 && !tractUi.tongueTouch.alive)
    tractUi.tongueTouch = 0;

  if (tractUi.tongueTouch == 0) {
    for (var j = 0; j < ui.touchesWithMouse.length; j++) {
      var touch = ui.touchesWithMouse[j];
      if (!touch.alive) continue;
      if (touch.fricative_intensity == 1) continue; //only new touches will pass tractUi
      var x = touch.x;
      var y = touch.y;
      var index = getIndex(TractUI, x, y);
      var diameter = getDiameter(TractUI, x, y);
      if (
        index >= tractUi.tongueLowerIndexBound - 4 &&
        index <= tractUi.tongueUpperIndexBound + 4 &&
        diameter >= tractUi.innerTongueControlRadius - 0.5 &&
        diameter <= tractUi.outerTongueControlRadius + 0.5
      ) {
        tractUi.tongueTouch = touch;
      }
    }
  }

  if (tractUi.tongueTouch != 0) {
    var x = tractUi.tongueTouch.x;
    var y = tractUi.tongueTouch.y;
    var index = getIndex(TractUI, x, y);
    var diameter = getDiameter(TractUI, x, y);
    var fromPoint =
      (tractUi.outerTongueControlRadius - diameter) /
      (tractUi.outerTongueControlRadius - tractUi.innerTongueControlRadius);
    fromPoint = clamp(fromPoint, 0, 1);
    fromPoint =
      Math.pow(fromPoint, 0.58) - 0.2 * (fromPoint * fromPoint - fromPoint); //horrible kludge to fit curve to straight line
    tractUi.tongueDiameter = clamp(
      diameter,
      tractUi.innerTongueControlRadius,
      tractUi.outerTongueControlRadius,
    );
    //tractUi.tongueIndex = clamp(index, tractUi.tongueLowerIndexBound, tractUi.tongueUpperIndexBound);
    var out =
      fromPoint *
      0.5 *
      (tractUi.tongueUpperIndexBound - tractUi.tongueLowerIndexBound);
    tractUi.tongueIndex = clamp(
      index,
      tractUi.tongueIndexCentre - out,
      tractUi.tongueIndexCentre + out,
    );
  }

  setRestDiameter(tractUi);
  for (var i = 0; i < Mouthbook.n; i++)
    Tract.targetDiameter[i] = Tract.restDiameter[i];

  //other constrictions and nose
  Tract.velumTarget = 0.01;
  for (var j = 0; j < ui.touchesWithMouse.length; j++) {
    var touch = ui.touchesWithMouse[j];
    if (!touch.alive) continue;
    var x = touch.x;
    var y = touch.y;
    var index = getIndex(TractUI, x, y);
    var diameter = getDiameter(TractUI, x, y);
    if (index > Mouthbook.noseStart && diameter < -tractUi.noseOffset) {
      Tract.velumTarget = 0.4;
    }
    if (diameter < -0.85 - tractUi.noseOffset) continue;
    diameter -= 0.3;
    if (diameter < 0) diameter = 0;
    var width = 2;
    if (index < 25) width = 10;
    else if (index >= Mouthbook.tipStart) width = 5;
    else width = 10 - (5 * (index - 25)) / (Mouthbook.tipStart - 25);
    if (
      index >= 2 &&
      index < Mouthbook.n &&
      y < tractCanvas.height &&
      diameter < 3
    ) {
      let intIndex = Math.round(index);
      for (var i = -Math.ceil(width) - 1; i < width + 1; i++) {
        if (intIndex + i < 0 || intIndex + i >= Mouthbook.n) continue;
        var relpos = intIndex + i - index;
        relpos = Math.abs(relpos) - 0.5;
        var shrink;
        if (relpos <= 0) shrink = 0;
        else if (relpos > width) shrink = 1;
        else shrink = 0.5 * (1 - Math.cos((Math.PI * relpos) / width));
        if (diameter < Tract.targetDiameter[intIndex + i]) {
          Tract.targetDiameter[intIndex + i] =
            diameter + (Tract.targetDiameter[intIndex + i] - diameter) * shrink;
        }
      }
    }
  }
};
