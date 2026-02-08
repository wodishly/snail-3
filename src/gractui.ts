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

  init: function (
    backContext: CanvasRenderingContext2D,
    tractContext: CanvasRenderingContext2D,
  ) {
    this.ctx = tractContext;
    this.setRestDiameter();
    for (var i = 0; i < Mouthbook.n; i++) {
      Tract.diameter[i] = Tract.targetDiameter[i] = Tract.restDiameter[i];
    }
    this.drawBackground(backContext, tractContext);
    this.tongueLowerIndexBound = Mouthbook.bladeStart + 2;
    this.tongueUpperIndexBound = Mouthbook.tipStart - 3;
    this.tongueIndexCentre =
      0.5 * (this.tongueLowerIndexBound + this.tongueUpperIndexBound);
  },

  moveTo: function (i: number, d: number) {
    let angle =
      this.angleOffset +
      (i * this.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
    let wobble =
      Tract.maxAmplitude[Mouthbook.n - 1] +
      Tract.noseMaxAmplitude[Mouthbook.noseLength - 1];
    wobble *=
      (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
      Mouthbook.n;
    angle += wobble;
    var r = this.radius - this.scale * d + 100 * wobble;
    this.ctx.moveTo(
      this.originX - r * Math.cos(angle),
      this.originY - r * Math.sin(angle),
    );
  },

  lineTo: function (i: number, d: number) {
    let angle =
      this.angleOffset +
      (i * this.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
    let wobble =
      Tract.maxAmplitude[Mouthbook.n - 1] +
      Tract.noseMaxAmplitude[Mouthbook.noseLength - 1];
    wobble *=
      (0.03 * Math.sin(2 * i - 50 * (performance.now() / 1000)) * i) /
      Mouthbook.n;
    angle += wobble;
    const r = this.radius - this.scale * d + 100 * wobble;
    this.ctx.lineTo(
      this.originX - r * Math.cos(angle),
      this.originY - r * Math.sin(angle),
    );
  },

  drawText: function (i: number, d: number, text: string) {
    const angle =
      this.angleOffset +
      (i * this.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
    const r = this.radius - this.scale * d;
    this.ctx.save();
    this.ctx.translate(
      this.originX - r * Math.cos(angle),
      this.originY - r * Math.sin(angle) + 2,
    );
    this.ctx.rotate(angle - Math.PI / 2);
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
  },

  drawTextStraight: function (i: number, d: number, text: string) {
    const angle =
      this.angleOffset +
      (i * this.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
    const r = this.radius - this.scale * d;
    this.ctx.save();
    this.ctx.translate(
      this.originX - r * Math.cos(angle),
      this.originY - r * Math.sin(angle) + 2,
    );
    this.ctx.fillText(text, 0, 0);
    this.ctx.restore();
  },

  drawCircle: function (i: number, d: number, radius: number) {
    const angle =
      this.angleOffset +
      (i * this.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
    const r = this.radius - this.scale * d;
    this.ctx.beginPath();
    this.ctx.arc(
      this.originX - r * Math.cos(angle),
      this.originY - r * Math.sin(angle),
      radius,
      0,
      2 * Math.PI,
    );
    this.ctx.fill();
  },

  getIndex: function (x: number, y: number) {
    const xx = x - this.originX;
    const yy = y - this.originY;
    let angle = Math.atan2(yy, xx);
    while (angle > 0) angle -= 2 * Math.PI;
    return (
      ((Math.PI + angle - this.angleOffset) * (Mouthbook.lipStart - 1)) /
      (this.angleScale * Math.PI)
    );
  },
  getDiameter: function (x: number, y: number) {
    const xx = x - this.originX;
    const yy = y - this.originY;
    return (this.radius - Math.sqrt(xx * xx + yy * yy)) / this.scale;
  },

  drawTractUi: function (glottis: Throat, ui: UiType, canvasSize: Z) {
    this.ctx.clearRect(0, 0, canvasSize.x, canvasSize.y);
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    this.drawTongueControl();
    this.drawPitchControl(glottis);

    var velum = Tract.noseDiameter[0];
    var velumAngle = velum * 4;

    //first draw fill
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.fillColour;
    this.ctx.fillStyle = this.fillColour;
    this.moveTo(1, 0);
    for (var i = 1; i < Mouthbook.n; i++) this.lineTo(i, Tract.diameter[i]);
    for (var i = Mouthbook.n - 1; i >= 2; i--) this.lineTo(i, 0);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.fill();

    //for nose
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.fillColour;
    this.ctx.fillStyle = this.fillColour;
    this.moveTo(Mouthbook.noseStart, -this.noseOffset);
    for (var i = 1; i < Mouthbook.noseLength; i++)
      this.lineTo(
        i + Mouthbook.noseStart,
        -this.noseOffset - Tract.noseDiameter[i] * 0.9,
      );
    for (var i = Mouthbook.noseLength - 1; i >= 1; i--)
      this.lineTo(i + Mouthbook.noseStart, -this.noseOffset);
    this.ctx.closePath();
    //this.ctx.stroke();
    this.ctx.fill();

    //velum
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.fillColour;
    this.ctx.fillStyle = this.fillColour;
    this.moveTo(Mouthbook.noseStart - 2, 0);
    this.lineTo(Mouthbook.noseStart, -this.noseOffset);
    this.lineTo(Mouthbook.noseStart + velumAngle, -this.noseOffset);
    this.lineTo(Mouthbook.noseStart + velumAngle - 2, 0);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.fill();

    //white text
    this.ctx.fillStyle = "white";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.globalAlpha = 1.0;
    this.drawText(Mouthbook.n * 0.1, 0.425, "throat");
    this.drawText(Mouthbook.n * 0.71, -1.8, "nasal");
    this.drawText(Mouthbook.n * 0.71, -1.3, "cavity");
    this.ctx.font = "22px Arial";
    this.drawText(Mouthbook.n * 0.6, 0.9, "oral");
    this.drawText(Mouthbook.n * 0.7, 0.9, "cavity");

    this.drawAmplitudes();

    //then draw lines
    this.ctx.beginPath();
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = this.lineColour;
    this.ctx.lineJoin = "round";
    this.ctx.lineCap = "round";
    this.moveTo(1, Tract.diameter[0]);
    for (let i = 2; i < Mouthbook.n; i++) this.lineTo(i, Tract.diameter[i]);
    this.moveTo(1, 0);
    for (let i = 2; i <= Mouthbook.noseStart - 2; i++) this.lineTo(i, 0);
    this.moveTo(Mouthbook.noseStart + velumAngle - 2, 0);
    for (
      let i = Mouthbook.noseStart + Math.ceil(velumAngle) - 2;
      i < Mouthbook.n;
      i++
    )
      this.lineTo(i, 0);
    this.ctx.stroke();

    //for nose
    this.ctx.beginPath();
    this.ctx.lineWidth = 5;
    this.ctx.strokeStyle = this.lineColour;
    this.ctx.lineJoin = "round";
    this.moveTo(Mouthbook.noseStart, -this.noseOffset);
    for (var i = 1; i < Mouthbook.noseLength; i++)
      this.lineTo(
        i + Mouthbook.noseStart,
        -this.noseOffset - Tract.noseDiameter[i] * 0.9,
      );
    this.moveTo(Mouthbook.noseStart + velumAngle, -this.noseOffset);
    for (let i = Math.ceil(velumAngle); i < Mouthbook.noseLength; i++)
      this.lineTo(i + Mouthbook.noseStart, -this.noseOffset);
    this.ctx.stroke();

    //velum
    this.ctx.globalAlpha = velum * 5;
    this.ctx.beginPath();
    this.moveTo(Mouthbook.noseStart - 2, 0);
    this.lineTo(Mouthbook.noseStart, -this.noseOffset);
    this.moveTo(Mouthbook.noseStart + velumAngle - 2, 0);
    this.lineTo(Mouthbook.noseStart + velumAngle, -this.noseOffset);
    this.ctx.stroke();

    this.ctx.fillStyle = "orchid";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.globalAlpha = 0.7;
    this.drawText(
      Mouthbook.n * 0.95,
      0.8 + 0.8 * Tract.diameter[Mouthbook.n - 1],
      " lip",
    );

    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = "black";
    this.ctx.textAlign = "left";
    this.ctx.fillText(ui.debugText, 20, 20);
  },

  drawBackground: function (
    backContext: CanvasRenderingContext2D,
    tractContext: CanvasRenderingContext2D,
  ) {
    this.ctx = backContext;

    //text
    this.ctx.fillStyle = "orchid";
    this.ctx.font = "20px Arial";
    this.ctx.textAlign = "center";
    this.ctx.globalAlpha = 0.7;
    this.drawText(Mouthbook.n * 0.44, -0.28, "soft");
    this.drawText(Mouthbook.n * 0.51, -0.28, "palate");
    this.drawText(Mouthbook.n * 0.77, -0.28, "hard");
    this.drawText(Mouthbook.n * 0.84, -0.28, "palate");
    this.drawText(Mouthbook.n * 0.95, -0.28, " lip");

    this.ctx.font = "17px Arial";
    this.drawTextStraight(Mouthbook.n * 0.18, 3, "  tongue control");
    this.ctx.textAlign = "left";
    this.drawText(Mouthbook.n * 1.03, -1.07, "nasals");
    this.drawText(Mouthbook.n * 1.03, -0.28, "stops");
    this.drawText(Mouthbook.n * 1.03, 0.51, "fricatives");
    //this.drawTextStraight(1.5, +0.8, "glottis")
    this.ctx.strokeStyle = "orchid";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.moveTo(Mouthbook.n * 1.03, 0);
    this.lineTo(Mouthbook.n * 1.07, 0);
    this.moveTo(Mouthbook.n * 1.03, -this.noseOffset);
    this.lineTo(Mouthbook.n * 1.07, -this.noseOffset);
    this.ctx.stroke();
    this.ctx.globalAlpha = 0.9;
    this.ctx.globalAlpha = 1.0;
    this.ctx = tractContext;
  },

  drawAmplitudes: function () {
    this.ctx.strokeStyle = "orchid";
    this.ctx.lineCap = "butt";
    this.ctx.globalAlpha = 0.3;
    for (var i = 2; i < Mouthbook.n - 1; i++) {
      this.ctx.beginPath();
      this.ctx.lineWidth = Math.sqrt(Tract.maxAmplitude[i]) * 3;
      this.moveTo(i, 0);
      this.lineTo(i, Tract.diameter[i]);
      this.ctx.stroke();
    }
    for (var i = 1; i < Mouthbook.noseLength - 1; i++) {
      this.ctx.beginPath();
      this.ctx.lineWidth = Math.sqrt(Tract.noseMaxAmplitude[i]) * 3;
      this.moveTo(i + Mouthbook.noseStart, -this.noseOffset);
      this.lineTo(
        i + Mouthbook.noseStart,
        -this.noseOffset - Tract.noseDiameter[i] * 0.9,
      );
      this.ctx.stroke();
    }
    this.ctx.globalAlpha = 1;
  },

  drawTongueControl: function () {
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = palePink;
    this.ctx.fillStyle = palePink;
    this.ctx.globalAlpha = 1.0;
    this.ctx.beginPath();
    this.ctx.lineWidth = 45;

    //outline
    this.moveTo(this.tongueLowerIndexBound, this.innerTongueControlRadius);
    for (
      var i = this.tongueLowerIndexBound + 1;
      i <= this.tongueUpperIndexBound;
      i++
    )
      this.lineTo(i, this.innerTongueControlRadius);
    this.lineTo(this.tongueIndexCentre, this.outerTongueControlRadius);
    this.ctx.closePath();
    this.ctx.stroke();
    this.ctx.fill();

    var a = this.innerTongueControlRadius;
    var c = this.outerTongueControlRadius;
    var b = 0.5 * (a + c);
    var r = 3;
    this.ctx.fillStyle = "orchid";
    this.ctx.globalAlpha = 0.3;
    this.drawCircle(this.tongueIndexCentre, a, r);
    this.drawCircle(this.tongueIndexCentre - 4.25, a, r);
    this.drawCircle(this.tongueIndexCentre - 8.5, a, r);
    this.drawCircle(this.tongueIndexCentre + 4.25, a, r);
    this.drawCircle(this.tongueIndexCentre + 8.5, a, r);
    this.drawCircle(this.tongueIndexCentre - 6.1, b, r);
    this.drawCircle(this.tongueIndexCentre + 6.1, b, r);
    this.drawCircle(this.tongueIndexCentre, b, r);
    this.drawCircle(this.tongueIndexCentre, c, r);

    this.ctx.globalAlpha = 1.0;

    //circle for tongue position
    var angle =
      this.angleOffset +
      (this.tongueIndex * this.angleScale * Math.PI) / (Mouthbook.lipStart - 1);
    var r = this.radius - this.scale * this.tongueDiameter;
    var x = this.originX - r * Math.cos(angle);
    var y = this.originY - r * Math.sin(angle);
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = "orchid";
    this.ctx.globalAlpha = 0.7;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 18, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.globalAlpha = 0.15;
    this.ctx.fill();
    this.ctx.globalAlpha = 1.0;

    this.ctx.fillStyle = "orchid";
  },

  drawPitchControl: function (glottis: Throat) {
    var w = 9;
    var h = 15;
    if (glottis.z.x) {
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = "orchid";
      this.ctx.globalAlpha = 0.7;
      this.ctx.beginPath();
      this.ctx.moveTo(glottis.z.x - w, glottis.z.y - h);
      this.ctx.lineTo(glottis.z.x + w, glottis.z.y - h);
      this.ctx.lineTo(glottis.z.x + w, glottis.z.y + h);
      this.ctx.lineTo(glottis.z.x - w, glottis.z.y + h);
      this.ctx.closePath();
      this.ctx.stroke();
      this.ctx.globalAlpha = 0.15;
      this.ctx.fill();
      this.ctx.globalAlpha = 1.0;
    }
  },

  setRestDiameter: function () {
    for (var i = Mouthbook.bladeStart; i < Mouthbook.lipStart; i++) {
      var t =
        (1.1 * Math.PI * (this.tongueIndex - i)) /
        (Mouthbook.tipStart - Mouthbook.bladeStart);
      var fixedTongueDiameter = 2 + (this.tongueDiameter - 2) / 1.5;
      var curve = (1.5 - fixedTongueDiameter + this.gridOffset) * Math.cos(t);
      if (i == Mouthbook.bladeStart - 2 || i == Mouthbook.lipStart - 1)
        curve *= 0.8;
      if (i == Mouthbook.bladeStart || i == Mouthbook.lipStart - 2)
        curve *= 0.94;
      Tract.restDiameter[i] = 1.5 - curve;
    }
  },

  handleTouches: function (ui: UiType) {
    if (this.tongueTouch != 0 && !this.tongueTouch.alive) this.tongueTouch = 0;

    if (this.tongueTouch == 0) {
      for (var j = 0; j < ui.touchesWithMouse.length; j++) {
        var touch = ui.touchesWithMouse[j];
        if (!touch.alive) continue;
        if (touch.fricative_intensity == 1) continue; //only new touches will pass this
        var x = touch.x;
        var y = touch.y;
        var index = TractUI.getIndex(x, y);
        var diameter = TractUI.getDiameter(x, y);
        if (
          index >= this.tongueLowerIndexBound - 4 &&
          index <= this.tongueUpperIndexBound + 4 &&
          diameter >= this.innerTongueControlRadius - 0.5 &&
          diameter <= this.outerTongueControlRadius + 0.5
        ) {
          this.tongueTouch = touch;
        }
      }
    }

    if (this.tongueTouch != 0) {
      var x = this.tongueTouch.x;
      var y = this.tongueTouch.y;
      var index = TractUI.getIndex(x, y);
      var diameter = TractUI.getDiameter(x, y);
      var fromPoint =
        (this.outerTongueControlRadius - diameter) /
        (this.outerTongueControlRadius - this.innerTongueControlRadius);
      fromPoint = clamp(fromPoint, 0, 1);
      fromPoint =
        Math.pow(fromPoint, 0.58) - 0.2 * (fromPoint * fromPoint - fromPoint); //horrible kludge to fit curve to straight line
      this.tongueDiameter = clamp(
        diameter,
        this.innerTongueControlRadius,
        this.outerTongueControlRadius,
      );
      //this.tongueIndex = clamp(index, this.tongueLowerIndexBound, this.tongueUpperIndexBound);
      var out =
        fromPoint *
        0.5 *
        (this.tongueUpperIndexBound - this.tongueLowerIndexBound);
      this.tongueIndex = clamp(
        index,
        this.tongueIndexCentre - out,
        this.tongueIndexCentre + out,
      );
    }

    this.setRestDiameter();
    for (var i = 0; i < Mouthbook.n; i++)
      Tract.targetDiameter[i] = Tract.restDiameter[i];

    //other constrictions and nose
    Tract.velumTarget = 0.01;
    for (var j = 0; j < ui.touchesWithMouse.length; j++) {
      var touch = ui.touchesWithMouse[j];
      if (!touch.alive) continue;
      var x = touch.x;
      var y = touch.y;
      var index = TractUI.getIndex(x, y);
      var diameter = TractUI.getDiameter(x, y);
      if (index > Mouthbook.noseStart && diameter < -this.noseOffset) {
        Tract.velumTarget = 0.4;
      }
      if (diameter < -0.85 - this.noseOffset) continue;
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
              diameter +
              (Tract.targetDiameter[intIndex + i] - diameter) * shrink;
          }
        }
      }
    }
  },
};
