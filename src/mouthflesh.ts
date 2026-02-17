import { type Mouth } from "./mouth";
import { setPitch, type Throat } from "./throat";
import { type Flesh } from "./flesh";
import { clamp, weave } from "./help/math";
import {
  Fastenings,
  Mouthbook,
  noseLength,
  palePink,
  Settings,
  tongueLowerBound,
  tongueMiddle,
  tongueUpperBound,
} from "./settings";
import type { Assert } from "./help/type";
import { canvasToTongue, strokeLine, tongueToCanvas } from "./canvas";
import type { Rineful, Tongue } from "./rine";
import { pushSpell, type Song } from "./speak";
import { startSound, type Snail } from "./snail";

export interface Mouthflesh extends Tongue, Rineful {
  html: {
    rine: HTMLSpanElement;
  };
}

export const makeMouthflesh = (): Mouthflesh => {
  return {
    ...Settings.start.mouthflesh,
    rine: undefined,
    html: {
      rine: document.querySelector("#tongueRine")!,
    },
  };
};

export const startListeners = (
  snail: Snail,
  throat: Throat,
  mouth: Mouth,
  flesh: Flesh,
  mouthflesh: Mouthflesh,
  song: Song,
) => {
  const speech = document.querySelector("#speech") as Assert<HTMLInputElement>;
  speech.addEventListener("input", () => {
    if (!"aeiou".split("").includes(speech.value.at(-1) ?? "")) {
      speech.value = speech.value.slice(0, -1);
    }
  });

  const speakKnob = document.querySelector(
    "#speak",
  ) as Assert<HTMLButtonElement>;
  speakKnob.addEventListener("click", () => {
    startSound(snail, throat, mouth, flesh);
    pushSpell(song, speech);
  });

  const aSlider = document.querySelector("#a") as Assert<HTMLInputElement>;
  const f0Slider = document.querySelector("#f0") as Assert<HTMLInputElement>;

  aSlider.addEventListener("input", () => {
    setPitch(throat, parseFloat(f0Slider.value), parseFloat(aSlider.value));
  });
  f0Slider.addEventListener("input", () => {
    setPitch(throat, parseFloat(f0Slider.value), parseFloat(aSlider.value));
  });

  const f1Slider = document.querySelector("#f1") as Assert<HTMLInputElement>;
  const f2Slider = document.querySelector("#f2") as Assert<HTMLInputElement>;
  f1Slider.addEventListener("input", () => {
    mouthflesh.berth = parseFloat(f1Slider.value);
    mouthflesh.width = parseFloat(f2Slider.value);
    moveTongueAndLips(mouthflesh, mouth, flesh);
  });
  f2Slider.addEventListener("input", () => {
    mouthflesh.berth = parseFloat(f1Slider.value);
    mouthflesh.width = parseFloat(f2Slider.value);
    moveTongueAndLips(mouthflesh, mouth, flesh);
  });
};

export const startMouthflesh = (
  snail: Snail,
  throat: Throat,
  mouth: Mouth,
  flesh: Flesh,
  mouthflesh: Mouthflesh,
  song: Song,
  backcontext: CanvasRenderingContext2D,
  forecontext: CanvasRenderingContext2D,
) => {
  startListeners(snail, throat, mouth, flesh, mouthflesh, song);
  setRestWidth(mouth, mouthflesh);
  for (let i = 0; i < Mouthbook.length; i++) {
    mouth.width[i].now = mouth.width[i].goal = mouth.width[i].rest;
  }
  drawBackground(mouth, backcontext, forecontext);
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
  berth: number,
  x: number,
  y: number,
) => {
  context.fillStyle = "black";
  context.textBaseline = "middle";
  context.font = "12px sans-serif";
  context.fillText(`${berth}`, x, y);
};

const drawAmplitudes = (mouth: Mouth, context: CanvasRenderingContext2D) => {
  context.strokeStyle = "orchid";
  context.lineCap = "butt";
  context.globalAlpha = 0.3;

  // mouth
  for (let i = 2; i < Mouthbook.length - 1; i++) {
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
  for (let i = 1; i < noseLength() - 1; i++) {
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
 * Sets the new rest widths for the given tongue berth and width.
 */
const setRestWidth = (
  mouth: Mouth,
  { berth, width }: Tongue,
  doRing = false,
) => {
  for (let i = Mouthbook.bodyStart; i < Mouthbook.lipStart; i++) {
    const t =
      (1.1 * Math.PI * (berth - i)) /
      (Mouthbook.bladeStart - Mouthbook.bodyStart);
    const fixedTongueDiameter = 2 + (width - 2) / 1.5;
    let curve =
      (1.5 - fixedTongueDiameter + Settings.mouthflesh.gridOffset) *
      Math.cos(t);
    if (i === Mouthbook.bodyStart - 2 || i === Mouthbook.lipStart - 1) {
      curve *= 0.8;
    }
    if (i === Mouthbook.bodyStart || i === Mouthbook.lipStart - 2) {
      curve *= 0.94;
    }
    mouth.width[i].rest = 1.5 - curve;
  }
  if (doRing) {
    for (let i = Mouthbook.lipStart; i < Mouthbook.length; i++) {
      mouth.width[i].rest = 0.5;
    }
  } else {
    for (let i = Mouthbook.lipStart; i < Mouthbook.length; i++) {
      /** @todo find what 1.5 should be (it's eyeballed right now) */
      mouth.width[i].rest = 1.5;
    }
  }
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
  drawText(tractContext, Mouthbook.length * 0.44, -0.28, "soft");
  drawText(tractContext, Mouthbook.length * 0.51, -0.28, "palate");
  drawText(tractContext, Mouthbook.length * 0.77, -0.28, "hard");
  drawText(tractContext, Mouthbook.length * 0.84, -0.28, "palate");
  drawText(tractContext, Mouthbook.length * 0.95, -0.28, " lip");

  tractContext.font = "17px Arial";
  drawTextStraight(
    tractContext,
    Mouthbook.length * 0.18,
    3,
    "  tongue control",
  );
  tractContext.textAlign = "left";
  drawText(tractContext, Mouthbook.length * 1.03, -1.07, "nasals");
  drawText(tractContext, Mouthbook.length * 1.03, -0.28, "stops");
  drawText(tractContext, Mouthbook.length * 1.03, 0.51, "fricatives");
  tractContext.strokeStyle = "orchid";
  tractContext.lineWidth = 2;
  tractContext.beginPath();
  moveMouthfleshTo(mouth, tractContext, Mouthbook.length * 1.03, 0);
  lineMouthfleshTo(mouth, tractContext, Mouthbook.length * 1.07, 0);
  moveMouthfleshTo(
    mouth,
    tractContext,
    Mouthbook.length * 1.03,
    -Settings.mouthflesh.noseOffset,
  );
  lineMouthfleshTo(
    mouth,
    tractContext,
    Mouthbook.length * 1.07,
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
    mouth.maxAmplitude[Mouthbook.length - 1] +
    mouth.nose.maxAmplitude[noseLength() - 1];

  wobble *=
    (0.03 * Math.sin(2 * index - 50 * (performance.now() / 1000)) * index) /
    Mouthbook.length;
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
    mouth.maxAmplitude[Mouthbook.length - 1] +
    mouth.nose.maxAmplitude[noseLength() - 1];

  wobble *=
    (0.03 * Math.sin(2 * index - 50 * (performance.now() / 1000)) * index) /
    Mouthbook.length;
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
  const { x, y } = tongueToCanvas(mouthflesh.berth, mouthflesh.width);
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

export const drawMouthflesh = (
  mouthflesh: Mouthflesh,
  context: CanvasRenderingContext2D,
  mouth: Mouth,
) => {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  drawTongueControl(mouthflesh, mouth, context);
  // drawPitchControl(context, throat);

  const velum = mouth.nose.width[0];
  const velumAngle = velum * 4;

  //first draw fill
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = Settings.mouthflesh.fillColour;
  context.fillStyle = Settings.mouthflesh.fillColour;
  moveMouthfleshTo(mouth, context, 1, 0);
  for (let i = 1; i < Mouthbook.length; i++)
    lineMouthfleshTo(mouth, context, i, mouth.width[i].now);
  for (let i = Mouthbook.length - 1; i >= 2; i--)
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
  for (let i = 1; i < noseLength(); i++)
    lineMouthfleshTo(
      mouth,
      context,
      i + Mouthbook.noseStart,
      -Settings.mouthflesh.noseOffset - mouth.nose.width[i] * 0.9,
    );
  for (let i = noseLength() - 1; i >= 1; i--)
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
  drawText(context, Mouthbook.length * 0.1, 0.425, "throat");
  drawText(context, Mouthbook.length * 0.71, -1.8, "nasal");
  drawText(context, Mouthbook.length * 0.71, -1.3, "cavity");
  context.font = "22px Arial";
  drawText(context, Mouthbook.length * 0.6, 0.9, "oral");
  drawText(context, Mouthbook.length * 0.7, 0.9, "cavity");

  drawAmplitudes(mouth, context);

  //then draw lines
  context.beginPath();
  context.lineWidth = 5;
  context.strokeStyle = Settings.mouthflesh.lineColour;
  context.lineJoin = "round";
  context.lineCap = "round";
  moveMouthfleshTo(mouth, context, 1, mouth.width[0].now);
  for (let i = 2; i < Mouthbook.length; i++)
    lineMouthfleshTo(mouth, context, i, mouth.width[i].now);
  moveMouthfleshTo(mouth, context, 1, 0);
  for (let i = 2; i <= Mouthbook.noseStart - 2; i++)
    lineMouthfleshTo(mouth, context, i, 0);
  moveMouthfleshTo(mouth, context, Mouthbook.noseStart + velumAngle - 2, 0);
  for (
    let i = Mouthbook.noseStart + Math.ceil(velumAngle) - 2;
    i < Mouthbook.length;
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
  for (let i = 1; i < noseLength(); i++)
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
  for (let i = Math.ceil(velumAngle); i < noseLength(); i++)
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
    Mouthbook.length * 0.95,
    0.8 + 0.8 * mouth.width[Mouthbook.length - 1].now,
    " lip",
  );
};

export const handleMouthfleshTouches = (
  mouth: Mouth,
  flesh: Flesh,
  mouthflesh: Mouthflesh,
) => {
  // kill dead rine
  if (!mouthflesh.rine?.isDown) {
    mouthflesh.rine = undefined;
  }

  if (mouthflesh.rine === undefined) {
    for (let j = 0; j < flesh.mouserines.length; j++) {
      const rine = flesh.mouserines[j];

      if (!rine.isDown) {
        continue;
      }
      if (rine.fi === 1) {
        continue; //only new touches will pass mouthflesh
      }

      const { berth, width } = canvasToTongue(rine);

      // touch is in tongue control area
      if (
        berth >= tongueLowerBound() - 4 &&
        berth <= tongueUpperBound() + 4 &&
        width >= Settings.mouthflesh.innerTongueControlRadius - 0.5 &&
        width <= Settings.mouthflesh.outerTongueControlRadius + 0.5
      ) {
        mouthflesh.rine = rine;
      }
    }
  }
  if (mouthflesh.rine !== undefined) {
    // we're on the trapezoid
    const { berth, width } = canvasToTongue(mouthflesh.rine);
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
    mouthflesh.width = clamp(
      width,
      Settings.mouthflesh.innerTongueControlRadius,
      Settings.mouthflesh.outerTongueControlRadius,
    );

    const out = fromPoint * 0.5 * (tongueUpperBound() - tongueLowerBound());
    mouthflesh.berth = clamp(berth, tongueMiddle() - out, tongueMiddle() + out);
  }
  moveTongueAndLips(mouthflesh, mouth, flesh);
};

export const moveTongueAndLips = (
  target: Tongue,
  mouth: Mouth,
  flesh: Flesh,
  doRing = false,
) => {
  // first, bearing looseness

  setRestWidth(mouth, target, doRing);

  // set goal widths to rest widths
  for (let i = 0; i < Mouthbook.length; i++) {
    mouth.width[i].goal = mouth.width[i].rest;
  }

  // then, choking tightness

  mouth.sailgoal = Fastenings.sail.rest;

  for (let j = 0; j < flesh.mouserines.length; j++) {
    const rine = flesh.mouserines[j];
    if (!rine.isDown) {
      continue;
    }

    gesture(mouth, canvasToTongue(rine));
  }
};

const gesture = (mouth: Mouth, { berth, width }: Tongue) => {
  if (berth > Mouthbook.noseStart && width < -Settings.mouthflesh.noseOffset) {
    openNose(mouth);
  }
  if (width < -0.85 - Settings.mouthflesh.noseOffset) {
    // noseworthy rines skip the forthcoming mouthreckoning
    return;
  }

  // nudge the width so that `<= 0` iff fully shut
  const cookedWidth = Math.max(width - 0.3, 0);

  // vocal tract length?
  const length = 5 + 5 * clamp(1 - (berth - 25) / (Mouthbook.bladeStart - 25));
  if (berth >= 2 && berth < Mouthbook.length && cookedWidth < 3) {
    // clicked in mouth hole
    const wholeBerth = Math.round(berth);
    for (let i = -Math.ceil(length) - 1; i < length + 1; i++) {
      if (wholeBerth + i < 0 || Mouthbook.length <= wholeBerth + i) {
        continue;
      }

      if (cookedWidth < mouth.width[wholeBerth + i].goal) {
        // reckon farth (in either way) from rinenavel
        const farth = Math.abs(wholeBerth + i - berth) - 0.5;
        const goal = weave(
          cookedWidth,
          mouth.width[wholeBerth + i].goal,
          0.5 * (1 - Math.cos((Math.PI * clamp(farth, 0, length)) / length)),
        );
        reach(mouth, wholeBerth + i, goal);
      }
    }
  }
};

export const mouthfleshTools = () => {
  return {
    drawMouthflesh,
    startMouthflesh,
    makeMouthflesh,
  };
};

/** @mut */
const openNose = (mouth: Mouth) => {
  mouth.sailgoal = 0.4;
};

/**
 * @mut
 * @todo type `berth` as `Upto<(typeof Mouthbook)["length"]>`
 */
const reach = (mouth: Mouth, berth: number, goal: number) => {
  mouth.width[berth].goal = goal;
};
