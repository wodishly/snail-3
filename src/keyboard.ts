import { palePink, Settings } from "./settings";

export const drawKeyboard = (backcontext: CanvasRenderingContext2D) => {
  backcontext.strokeStyle = palePink;
  backcontext.fillStyle = palePink;
  backcontext.globalAlpha = 1.0;
  backcontext.lineCap = "round";
  backcontext.lineJoin = "round";

  drawBar(backcontext, 0.0, 0.4, 8);
  backcontext.globalAlpha = 0.7;
  drawBar(backcontext, 0.52, 0.72, 8);

  backcontext.strokeStyle = "orchid";
  backcontext.fillStyle = "orchid";
  for (var i = 0; i < Settings.keyboard.semitones; i++) {
    var keyWidth =
      Settings.keyboard.keyboardWidth / Settings.keyboard.semitones;
    var x = Settings.keyboard.keyboardLeft + (i + 1 / 2) * keyWidth;
    var y = Settings.keyboard.keyboardTop;
    if (Settings.keyboard.marks[(i + 3) % 12] == 1) {
      backcontext.lineWidth = 4;
      backcontext.globalAlpha = 0.4;
    } else {
      backcontext.lineWidth = 3;
      backcontext.globalAlpha = 0.2;
    }
    backcontext.beginPath();
    backcontext.moveTo(x, y + 9);
    backcontext.lineTo(x, y + Settings.keyboard.keyboardHeight * 0.4 - 9);
    backcontext.stroke();

    backcontext.lineWidth = 3;
    backcontext.globalAlpha = 0.15;

    backcontext.beginPath();
    backcontext.moveTo(x, y + Settings.keyboard.keyboardHeight * 0.52 + 6);
    backcontext.lineTo(x, y + Settings.keyboard.keyboardHeight * 0.72 - 6);
    backcontext.stroke();
  }

  backcontext.font = "17px Arial";
  backcontext.textAlign = "center";

  backcontext.fillStyle = "orchid";
  backcontext.globalAlpha = 0.7;
  backcontext.fillText("voicebox control", 300, 490);
  backcontext.fillText("pitch", 300, 592);

  backcontext.fillStyle = "orchid";
  backcontext.strokeStyle = "orchid";
  backcontext.globalAlpha = 0.3;

  backcontext.save();

  backcontext.translate(410, 587);
  drawArrow(backcontext, 80, 2, 10);
  backcontext.translate(-220, 0);
  backcontext.rotate(Math.PI);
  drawArrow(backcontext, 80, 2, 10);

  backcontext.restore();
  backcontext.globalAlpha = 1.0;
};

const drawArrow = (
  backcontext: CanvasRenderingContext2D,
  arrowLength: number,
  arrowheadWidth: number,
  arrowheadLength: number,
) => {
  backcontext.lineWidth = 2;
  backcontext.beginPath();
  backcontext.moveTo(-arrowLength, 0);
  backcontext.lineTo(0, 0);
  backcontext.lineTo(0, -arrowheadWidth);
  backcontext.lineTo(arrowheadLength, 0);
  backcontext.lineTo(0, arrowheadWidth);
  backcontext.lineTo(0, 0);
  backcontext.closePath();
  backcontext.stroke();
  backcontext.fill();
};

const drawBar = (
  backcontext: CanvasRenderingContext2D,
  topFactor: number,
  bottomFactor: number,
  radius: number,
) => {
  backcontext.lineWidth = radius * 2;
  backcontext.beginPath();
  backcontext.moveTo(
    Settings.keyboard.keyboardLeft + radius,
    Settings.keyboard.keyboardTop +
      topFactor * Settings.keyboard.keyboardHeight +
      radius,
  );
  backcontext.lineTo(
    Settings.keyboard.keyboardLeft + Settings.keyboard.keyboardWidth - radius,
    Settings.keyboard.keyboardTop +
      topFactor * Settings.keyboard.keyboardHeight +
      radius,
  );
  backcontext.lineTo(
    Settings.keyboard.keyboardLeft + Settings.keyboard.keyboardWidth - radius,
    Settings.keyboard.keyboardTop +
      bottomFactor * Settings.keyboard.keyboardHeight -
      radius,
  );
  backcontext.lineTo(
    Settings.keyboard.keyboardLeft + radius,
    Settings.keyboard.keyboardTop +
      bottomFactor * Settings.keyboard.keyboardHeight -
      radius,
  );
  backcontext.closePath();
  backcontext.stroke();
  backcontext.fill();
};
