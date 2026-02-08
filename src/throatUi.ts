import { palePink, Settings } from "./settings";

export const drawArrow = (
  backCtx: CanvasRenderingContext2D,
  arrowLength: number,
  arrowheadWidth: number,
  arrowheadLength: number,
) => {
  backCtx.lineWidth = 2;
  backCtx.beginPath();
  backCtx.moveTo(-arrowLength, 0);
  backCtx.lineTo(0, 0);
  backCtx.lineTo(0, -arrowheadWidth);
  backCtx.lineTo(arrowheadLength, 0);
  backCtx.lineTo(0, arrowheadWidth);
  backCtx.lineTo(0, 0);
  backCtx.closePath();
  backCtx.stroke();
  backCtx.fill();
};

export const drawBar = (
  backCtx: CanvasRenderingContext2D,
  topFactor: number,
  bottomFactor: number,
  radius: number,
) => {
  backCtx.lineWidth = radius * 2;
  backCtx.beginPath();
  backCtx.moveTo(
    Settings.ui.throat.keyboardLeft + radius,
    Settings.ui.throat.keyboardTop +
      topFactor * Settings.ui.throat.keyboardHeight +
      radius,
  );
  backCtx.lineTo(
    Settings.ui.throat.keyboardLeft +
      Settings.ui.throat.keyboardWidth -
      radius,
    Settings.ui.throat.keyboardTop +
      topFactor * Settings.ui.throat.keyboardHeight +
      radius,
  );
  backCtx.lineTo(
    Settings.ui.throat.keyboardLeft +
      Settings.ui.throat.keyboardWidth -
      radius,
    Settings.ui.throat.keyboardTop +
      bottomFactor * Settings.ui.throat.keyboardHeight -
      radius,
  );
  backCtx.lineTo(
    Settings.ui.throat.keyboardLeft + radius,
    Settings.ui.throat.keyboardTop +
      bottomFactor * Settings.ui.throat.keyboardHeight -
      radius,
  );
  backCtx.closePath();
  backCtx.stroke();
  backCtx.fill();
};

export const drawKeyboard = (backCtx: CanvasRenderingContext2D) => {
  backCtx.strokeStyle = palePink;
  backCtx.fillStyle = palePink;
  backCtx.globalAlpha = 1.0;
  backCtx.lineCap = "round";
  backCtx.lineJoin = "round";

  drawBar(backCtx, 0.0, 0.4, 8);
  backCtx.globalAlpha = 0.7;
  drawBar(backCtx, 0.52, 0.72, 8);

  backCtx.strokeStyle = "orchid";
  backCtx.fillStyle = "orchid";
  for (var i = 0; i < Settings.ui.throat.semitones; i++) {
    var keyWidth =
      Settings.ui.throat.keyboardWidth / Settings.ui.throat.semitones;
    var x = Settings.ui.throat.keyboardLeft + (i + 1 / 2) * keyWidth;
    var y = Settings.ui.throat.keyboardTop;
    if (Settings.ui.throat.marks[(i + 3) % 12] == 1) {
      backCtx.lineWidth = 4;
      backCtx.globalAlpha = 0.4;
    } else {
      backCtx.lineWidth = 3;
      backCtx.globalAlpha = 0.2;
    }
    backCtx.beginPath();
    backCtx.moveTo(x, y + 9);
    backCtx.lineTo(x, y + Settings.ui.throat.keyboardHeight * 0.4 - 9);
    backCtx.stroke();

    backCtx.lineWidth = 3;
    backCtx.globalAlpha = 0.15;

    backCtx.beginPath();
    backCtx.moveTo(x, y + Settings.ui.throat.keyboardHeight * 0.52 + 6);
    backCtx.lineTo(x, y + Settings.ui.throat.keyboardHeight * 0.72 - 6);
    backCtx.stroke();
  }

  backCtx.font = "17px Arial";
  backCtx.textAlign = "center";

  backCtx.fillStyle = "orchid";
  backCtx.globalAlpha = 0.7;
  backCtx.fillText("voicebox control", 300, 490);
  backCtx.fillText("pitch", 300, 592);

  backCtx.fillStyle = "orchid";
  backCtx.strokeStyle = "orchid";
  backCtx.globalAlpha = 0.3;

  backCtx.save();

  backCtx.translate(410, 587);
  drawArrow(backCtx, 80, 2, 10);
  backCtx.translate(-220, 0);
  backCtx.rotate(Math.PI);
  drawArrow(backCtx, 80, 2, 10);

  backCtx.restore();
  backCtx.globalAlpha = 1.0;
};
