import { Mouthbook, palePink } from "./settings";
import type { Maybe } from "./type";
import { isAlive, type Ui } from "./ui";

const TractUiSettings = {
  start: {
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
  },
  tongueLowerIndexBound: Mouthbook.bladeStart + 2,
  tongueUpperIndexBound: Mouthbook.tipStart - 3,
  tongueIndexCentre: (Mouthbook.bladeStart + Mouthbook.tipStart - 1) / 2,
} as const;

type TractUi = {
  backCanvas: HTMLCanvasElement;
  tractCanvas: HTMLCanvasElement;
} & {
  -readonly [K in keyof (typeof TractUiSettings)["start"]]: K extends "tongueTouch"
    ? Maybe<Touch>
    : (typeof TractUiSettings)["start"][K] extends number
      ? number
      : (typeof TractUiSettings)["start"][K] extends string
        ? string
        : never;
};

export const makeTractUi = (
  backCanvas: HTMLCanvasElement,
  tractCanvas: HTMLCanvasElement,
  tract: Tract,
): TractUi => {
  const tractUi: TractUi = {
    ...TractUiSettings.start,
    tongueTouch: undefined,
    backCanvas,
    tractCanvas,
  };

  setRestDiameter(tract, tractUi);

  for (let i = 0; i < tract.n; i++) {
    tract.diameter[i] = tract.targetDiameter[i] = tract.restDiameter[i];
  }

  drawBackground(tractUi);

  return tractUi;
};

type Tract = any;

export const setRestDiameter = (tract: Tract, tractUi: TractUi) => {
  for (let i = tract.bladeStart; i < tract.lipStart; i++) {
    const t =
      (1.1 * Math.PI * (tractUi.tongueIndex - i)) /
      (tract.tipStart - tract.bladeStart);
    const fixedTongueDiameter = 2 + (tractUi.tongueDiameter - 2) / 1.5;
    let curve = (1.5 - fixedTongueDiameter + tractUi.gridOffset) * Math.cos(t);
    if (i == tract.bladeStart - 2 || i == tract.lipStart - 1) curve *= 0.8;
    if (i == tract.bladeStart || i == tract.lipStart - 2) curve *= 0.94;
    tract.restDiameter[i] = 1.5 - curve;
  }
};

const getIndex = (tractUi: TractUi, x: number, y: number) => {
  const xx = x - tractUi.originX;
  const yy = y - tractUi.originY;
  let angle = Math.atan2(yy, xx);
  while (angle > 0) angle -= 2 * Math.PI;
  return (
    ((Math.PI + angle - tractUi.angleOffset) * (Mouthbook.lipStart - 1)) /
    (tractUi.angleScale * Math.PI)
  );
};

const getDiameter = (tractUi: TractUi, x: number, y: number) => {
  const xx = x - tractUi.originX;
  const yy = y - tractUi.originY;
  return (tractUi.radius - Math.sqrt(xx * xx + yy * yy)) / tractUi.scale;
};

const draw = (tractUi: TractUi, ui: Ui) => {
  const context = tractUi.tractCanvas.getContext("2d")!;
  context.clearRect(
    0,
    0,
    tractUi.tractCanvas.width,
    tractUi.tractCanvas.height,
  );
  context.lineCap = "round";
  context.lineJoin = "round";

  drawTongueControl(tractUi);
  drawPitchControl(tractUi);

  const velum = Tract.noseDiameter[0];
  const velumAngle = velum * 4;

  //first draw fill
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = tractUi.fillColour;
  context.fillStyle = tractUi.fillColour;
  moveTo(tractUi, 1, 0);
  for (let i = 1; i < Mouthbook.n; i++) {
    lineTo(tractUi, i, Tract.diameter[i]);
  }
  for (let i = Mouthbook.n - 1; i >= 2; i--) {
    lineTo(tractUi, i, 0);
  }
  context.closePath();
  context.stroke();
  context.fill();

  //for nose
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = tractUi.fillColour;
  context.fillStyle = tractUi.fillColour;
  moveTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  for (let i = 1; i < Mouthbook.noseLength; i++) {
    lineTo(
      tractUi,
      i + Mouthbook.noseStart,
      -tractUi.noseOffset - Tract.noseDiameter[i] * 0.9,
    );
  }
  for (let i = Mouthbook.noseLength - 1; i >= 1; i--) {
    lineTo(tractUi, i + Mouthbook.noseStart, -tractUi.noseOffset);
  }
  context.closePath();
  context.fill();

  //velum
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = tractUi.fillColour;
  context.fillStyle = tractUi.fillColour;
  moveTo(tractUi, Mouthbook.noseStart - 2, 0);
  lineTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  lineTo(tractUi, Mouthbook.noseStart + velumAngle, -tractUi.noseOffset);
  lineTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  context.closePath();
  context.stroke();
  context.fill();

  //white text
  context.fillStyle = "white";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.globalAlpha = 1.0;
  drawText(tractUi, Mouthbook.n * 0.1, 0.425, "throat");
  drawText(tractUi, Mouthbook.n * 0.71, -1.8, "nasal");
  drawText(tractUi, Mouthbook.n * 0.71, -1.3, "cavity");
  context.font = "22px Arial";
  drawText(tractUi, Mouthbook.n * 0.6, 0.9, "oral");
  drawText(tractUi, Mouthbook.n * 0.7, 0.9, "cavity");
  drawAmplitudes(tractUi);

  //then draw lines
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = tractUi.lineColour;
  context.lineJoin = "round";
  context.lineCap = "round";
  moveTo(tractUi, 1, Tract.diameter[0]);
  for (let i = 2; i < Mouthbook.n; i++) lineTo(tractUi, i, Tract.diameter[i]);
  moveTo(tractUi, 1, 0);
  for (let i = 2; i <= Mouthbook.noseStart - 2; i++) lineTo(tractUi, i, 0);
  moveTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  for (
    let i = Mouthbook.noseStart + Math.ceil(velumAngle) - 2;
    i < Mouthbook.n;
    i++
  )
    lineTo(tractUi, i, 0);
  context.stroke();

  //for nose
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = tractUi.lineColour;
  context.lineJoin = "round";
  moveTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  for (let i = 1; i < Mouthbook.noseLength; i++)
    lineTo(
      tractUi,
      i + Mouthbook.noseStart,
      -tractUi.noseOffset - Tract.noseDiameter[i] * 0.9,
    );
  moveTo(tractUi, Mouthbook.noseStart + velumAngle, -tractUi.noseOffset);
  for (let i = Math.ceil(velumAngle); i < Mouthbook.noseLength; i++)
    lineTo(tractUi, i + Mouthbook.noseStart, -tractUi.noseOffset);
  context.stroke();

  //velum
  context.globalAlpha = velum * 5;
  context.beginPath();
  moveTo(tractUi, Mouthbook.noseStart - 2, 0);
  lineTo(tractUi, Mouthbook.noseStart, -tractUi.noseOffset);
  moveTo(tractUi, Mouthbook.noseStart + velumAngle - 2, 0);
  lineTo(tractUi, Mouthbook.noseStart + velumAngle, -tractUi.noseOffset);
  context.stroke();

  context.fillStyle = "orchid";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.globalAlpha = 0.7;
  drawText(
    tractUi,
    Mouthbook.n * 0.95,
    0.8 + 0.8 * Tract.diameter[Mouthbook.n - 1],
    " lip",
  );
};

const drawPositions = (tractUi: TractUi) => {
  const context = tractUi.tractCanvas.getContext("2d")!;

  context.fillStyle = "orchid";
  context.font = "24px Arial";
  context.textAlign = "center";
  context.globalAlpha = 0.6;
  const a = 2;
  const b = 1.5;
  drawText(tractUi, 15, a + b * 0.6, "æ"); //pat
  drawText(tractUi, 13, a + b * 0.27, "ɑ"); //part
  drawText(tractUi, 12, a + b * 0.0, "ɒ"); //pot
  drawText(tractUi, 17.7, a + b * 0.05, "(ɔ)"); //port (rounded)
  drawText(tractUi, 27, a + b * 0.65, "ɪ"); //pit
  drawText(tractUi, 27.4, a + b * 0.21, "i"); //peat
  drawText(tractUi, 20, a + b * 1.0, "e"); //pet
  drawText(tractUi, 18.1, a + b * 0.37, "ʌ"); //putt
  //put ʊ
  drawText(tractUi, 23, a + b * 0.1, "(u)"); //poot (rounded)
  drawText(tractUi, 21, a + b * 0.6, "ə"); //pert [should be ɜ]

  const nasals = -1.1;
  const stops = -0.4;
  const fricatives = 0.3;
  const approximants = 1.1;
  context.globalAlpha = 0.8;

  //approximants
  drawText(tractUi, 38, approximants, "l");
  drawText(tractUi, 41, approximants, "w");

  //?
  drawText(tractUi, 4.5, 0.37, "h");

  if (Glottis.isTouched) {
    //voiced consonants
    drawText(tractUi, 31.5, fricatives, "ʒ");
    drawText(tractUi, 36, fricatives, "z");
    drawText(tractUi, 41, fricatives, "v");
    drawText(tractUi, 22, stops, "g");
    drawText(tractUi, 36, stops, "d");
    drawText(tractUi, 41, stops, "b");
    drawText(tractUi, 22, nasals, "ŋ");
    drawText(tractUi, 36, nasals, "n");
    drawText(tractUi, 41, nasals, "m");
  } else {
    //unvoiced consonants
    drawText(tractUi, 31.5, fricatives, "ʃ");
    drawText(tractUi, 36, fricatives, "s");
    drawText(tractUi, 41, fricatives, "f");
    drawText(tractUi, 22, stops, "k");
    drawText(tractUi, 36, stops, "t");
    drawText(tractUi, 41, stops, "p");
    drawText(tractUi, 22, nasals, "ŋ");
    drawText(tractUi, 36, nasals, "n");
    drawText(tractUi, 41, nasals, "m");
  }
};

const drawAmplitudes = (tractUi: TractUi) => {
  const context = tractUi.tractCanvas.getContext("2d")!;

  context.strokeStyle = "orchid";
  context.lineCap = "butt";
  context.globalAlpha = 0.3;
  for (let i = 2; i < Mouthbook.n - 1; i++) {
    context.beginPath();
    context.lineWidth = Math.sqrt(Tract.maxAmplitude[i]) * 3;
    moveTo(tractUi, i, 0);
    lineTo(tractUi, i, Tract.diameter[i]);
    context.stroke();
  }
  for (let i = 1; i < Mouthbook.noseLength - 1; i++) {
    context.beginPath();
    context.lineWidth = Math.sqrt(Tract.noseMaxAmplitude[i]) * 3;
    moveTo(tractUi, i + Mouthbook.noseStart, -tractUi.noseOffset);
    lineTo(
      tractUi,
      i + Mouthbook.noseStart,
      -tractUi.noseOffset - Tract.noseDiameter[i] * 0.9,
    );
    context.stroke();
  }
  context.globalAlpha = 1;
};

const drawTongueControl = (tractUi: TractUi) => {
  const context = tractUi.tractCanvas.getContext("2d")!;

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = palePink;
  context.fillStyle = palePink;
  context.globalAlpha = 1.0;
  context.beginPath();
  context.lineWidth = 45;

  //outline
  moveTo(
    tractUi,
    TractUiSettings.tongueLowerIndexBound,
    tractUi.innerTongueControlRadius,
  );
  for (
    let i = TractUiSettings.tongueLowerIndexBound + 1;
    i <= TractUiSettings.tongueUpperIndexBound;
    i++
  )
    lineTo(tractUi, i, tractUi.innerTongueControlRadius);
  lineTo(
    tractUi,
    TractUiSettings.tongueIndexCentre,
    tractUi.outerTongueControlRadius,
  );
  context.closePath();
  context.stroke();
  context.fill();

  const a = tractUi.innerTongueControlRadius;
  const c = tractUi.outerTongueControlRadius;
  const b = 0.5 * (a + c);
  const r = 3;
  context.fillStyle = "orchid";
  context.globalAlpha = 0.3;
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre, a, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre - 4.25, a, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre - 8.5, a, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre + 4.25, a, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre + 8.5, a, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre - 6.1, b, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre + 6.1, b, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre, b, r);
  drawCircle(tractUi, TractUiSettings.tongueIndexCentre, c, r);

  context.globalAlpha = 1.0;

  //circle for tongue position
  const angle =
    tractUi.angleOffset +
    (tractUi.tongueIndex * tractUi.angleScale * Math.PI) /
      (Mouthbook.lipStart - 1);
  const s = tractUi.radius - tractUi.scale * tractUi.tongueDiameter;
  const x = tractUi.originX - s * Math.cos(angle);
  const y = tractUi.originY - s * Math.sin(angle);
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

const drawPitchControl = (tractUi: TractUi) => {
  const context = tractUi.tractCanvas.getContext("2d")!;

  const w = 9;
  const h = 15;
  if (Glottis.x) {
    context.lineWidth = 4;
    context.strokeStyle = "orchid";
    context.globalAlpha = 0.7;
    context.beginPath();
    context.moveTo(Glottis.x - w, Glottis.y - h);
    context.lineTo(Glottis.x + w, Glottis.y - h);
    context.lineTo(Glottis.x + w, Glottis.y + h);
    context.lineTo(Glottis.x - w, Glottis.y + h);
    context.closePath();
    context.stroke();
    context.globalAlpha = 0.15;
    context.fill();
    context.globalAlpha = 1.0;
  }
};

const handleTouches = (tractUi: TractUi, ui: Ui) => {
  if (tractUi.tongueTouch !== undefined && !isAlive(tractUi.tongueTouch))
    tractUi.tongueTouch = 0;

  if (tractUi.tongueTouch == 0) {
    for (let j = 0; j < ui.touchesWithMouse.length; j++) {
      const touch = ui.touchesWithMouse[j];
      if (!isAlive(touch)) {
        continue;
      }
      if (touch.fricativeIntensity == 1) {
        continue; //only new touches will pass this
      }
      const index = getIndex(tractUi, touch.z.x, y);
      const diameter = getDiameter(tractUi, x, y);
      if (
        index >= TractUiSettings.tongueLowerIndexBound - 4 &&
        index <= TractUiSettings.tongueUpperIndexBound + 4 &&
        diameter >= tractUi.innerTongueControlRadius - 0.5 &&
        diameter <= tractUi.outerTongueControlRadius + 0.5
      ) {
        tractUi.tongueTouch = touch;
      }
    }
  }

  if (tractUi.tongueTouch != 0) {
    const { x, y } = tractUi.tongueTouch.z;
    const index = getIndex(tractUi, x, y);
    const diameter = getDiameter(tractUi, x, y);
    const fromPoint =
      (tractUi.outerTongueControlRadius - diameter) /
      (tractUi.outerTongueControlRadius - tractUi.innerTongueControlRadius);
    fromPoint = Math.clamp(fromPoint, 0, 1);
    fromPoint =
      Math.pow(fromPoint, 0.58) - 0.2 * (fromPoint * fromPoint - fromPoint); //horrible kludge to fit curve to straight line
    tractUi.tongueDiameter = Math.clamp(
      diameter,
      tractUi.innerTongueControlRadius,
      tractUi.outerTongueControlRadius,
    );
    //tractUi.tongueIndex = Math.clamp(index, tractUi.tongueLowerIndexBound, tractUi.tongueUpperIndexBound);
    const out =
      fromPoint *
      0.5 *
      (TractUiSettings.tongueUpperIndexBound - TractUiSettings.tongueLowerIndexBound);
    tractUi.tongueIndex = Math.clamp(
      index,
      TractUiSettings.tongueIndexCentre - out,
      TractUiSettings.tongueIndexCentre + out,
    );
  }

  tractUi.setRestDiameter();
  for (let i = 0; i < Mouthbook.n; i++)
    Tract.targetDiameter[i] = Tract.restDiameter[i];

  //other constrictions and nose
  Tract.velumTarget = 0.01;
  for (let j = 0; j < UI.touchesWithMouse.length; j++) {
    const touch = UI.touchesWithMouse[j];
    if (!touch.alive) continue;
    const x = touch.x;
    const y = touch.y;
    const index = TractUI.getIndex(x, y);
    const diameter = TractUI.getDiameter(x, y);
    if (index > Mouthbook.noseStart && diameter < -tractUi.noseOffset) {
      Tract.velumTarget = 0.4;
    }
    temp.a = index;
    temp.b = diameter;
    if (diameter < -0.85 - tractUi.noseOffset) continue;
    diameter -= 0.3;
    if (diameter < 0) diameter = 0;
    const width = 2;
    if (index < 25) width = 10;
    else if (index >= Mouthbook.tipStart) width = 5;
    else width = 10 - (5 * (index - 25)) / (Mouthbook.tipStart - 25);
    if (
      index >= 2 &&
      index < Mouthbook.n &&
      y < tractCanvas.height &&
      diameter < 3
    ) {
      intIndex = Math.round(index);
      for (let i = -Math.ceil(width) - 1; i < width + 1; i++) {
        if (intIndex + i < 0 || intIndex + i >= Mouthbook.n) continue;
        const relpos = intIndex + i - index;
        relpos = Math.abs(relpos) - 0.5;
        const shrink;
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

const drawBackground = (tractUi: TractUi) => {
  const context = tractUi.backCanvas.getContext("2d")!;

  //text
  context.fillStyle = "orchid";
  context.font = "20px Arial";
  context.textAlign = "center";
  context.globalAlpha = 0.7;
  drawText(tractUi, Mouthbook.n * 0.44, -0.28, "soft");
  drawText(tractUi, Mouthbook.n * 0.51, -0.28, "palate");
  drawText(tractUi, Mouthbook.n * 0.77, -0.28, "hard");
  drawText(tractUi, Mouthbook.n * 0.84, -0.28, "palate");
  drawText(tractUi, Mouthbook.n * 0.95, -0.28, " lip");

  context.font = "17px Arial";
  drawTextStraight(tractUi, Mouthbook.n * 0.18, 3, "  tongue control");

  context.textAlign = "left";
  drawText(tractUi, Mouthbook.n * 1.03, -1.07, "nasals");
  drawText(tractUi, Mouthbook.n * 1.03, -0.28, "stops");
  drawText(tractUi, Mouthbook.n * 1.03, 0.51, "fricatives");

  context.strokeStyle = "orchid";
  context.lineWidth = 2;
  context.beginPath();
  moveTo(tractUi, Mouthbook.n * 1.03, 0);
  lineTo(tractUi, Mouthbook.n * 1.07, 0);
  moveTo(tractUi, Mouthbook.n * 1.03, -tractUi.noseOffset);
  lineTo(tractUi, Mouthbook.n * 1.07, -tractUi.noseOffset);
  context.stroke();
  context.globalAlpha = 0.9;
  context.globalAlpha = 1.0;
};

const moveTo = (tractUi: TractUi, i: number, d: number) => {
  let angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  let wobble =
    Tract.maxAmplitude[Mouthbook.n - 1] +
    Mouthbook.noseMaxAmplitude[Mouthbook.noseLength - 1];
  wobble *= (0.03 * Math.sin(2 * i - 50 * performance.now()) * i) / Mouthbook.n;
  angle += wobble;
  const r = tractUi.radius - tractUi.scale * d + 100 * wobble;
  tractUi.tractCanvas
    .getContext("2d")!
    .moveTo(
      tractUi.originX - r * Math.cos(angle),
      tractUi.originY - r * Math.sin(angle),
    );
};

const lineTo = (tractUi: TractUi, i: number, d: number) => {
  let angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  let wobble =
    Tract.maxAmplitude[Mouthbook.n - 1] +
    Mouthbook.noseMaxAmplitude[Mouthbook.noseLength - 1];
  wobble *= (0.03 * Math.sin(2 * i - 50 * performance.now()) * i) / Mouthbook.n;
  angle += wobble;
  const r = tractUi.radius - tractUi.scale * d + 100 * wobble;
  tractUi.tractCanvas
    .getContext("2d")!
    .lineTo(
      tractUi.originX - r * Math.cos(angle),
      tractUi.originY - r * Math.sin(angle),
    );
};

const drawText = (tractUi: TractUi, i: number, d: number, text: string) => {
  const angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = tractUi.radius - tractUi.scale * d;

  const context = tractUi.tractCanvas.getContext("2d")!;
  context.save();
  context.translate(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle) + 2,
  ); //+8);
  context.rotate(angle - Math.PI / 2);
  context.fillText(text, 0, 0);
  context.restore();
};

const drawTextStraight = (
  tractUi: TractUi,
  i: number,
  d: number,
  text: string,
) => {
  const angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = tractUi.radius - tractUi.scale * d;

  const context = tractUi.tractCanvas.getContext("2d")!;
  context.save();
  context.translate(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle) + 2,
  );
  context.fillText(text, 0, 0);
  context.restore();
};

const drawCircle = (tractUi: TractUi, i: number, d: number, radius: number) => {
  const angle =
    tractUi.angleOffset +
    (i * tractUi.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
  const r = tractUi.radius - tractUi.scale * d;

  const context = tractUi.tractCanvas.getContext("2d")!;
  context.beginPath();
  context.arc(
    tractUi.originX - r * Math.cos(angle),
    tractUi.originY - r * Math.sin(angle),
    radius,
    0,
    2 * Math.PI,
  );
  context.fill();
};
