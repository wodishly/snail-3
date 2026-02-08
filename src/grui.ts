import { TractUI } from "./gractui";
import { mute, startSound, unmute, type Snail } from "./grail";
import { handleTouches, type Throat } from "./grottis";
import { draw, handleTouchStart, makeButton } from "./grutton";
import { clamp } from "./math";
import type { Wave } from "./wave";

export type UiType = typeof UI;

export const UI = {
  width: 600,
  top_margin: 5,
  left_margin: 5,
  inAboutScreen: true,
  inInstructionsScreen: false,
  instructionsLine: 0,
  debugText: "",
  autoWobble: true,
  alwaysVoice: true,

  init: function (audioSystem: Snail, glottis: Throat) {
    this.touchesWithMouse = [];
    this.mouseTouch = { alive: false, endTime: 0 };
    this.mouseDown = false;

    this.aboutButton = makeButton(460, 392, 140, 30, "about...", true);
    this.alwaysVoiceButton = makeButton(
      460,
      428,
      140,
      30,
      "always voice",
      true,
    );
    this.autoWobbleButton = makeButton(460, 464, 140, 30, "pitch wobble", true);

    document.addEventListener("mousedown", function (event) {
      UI.mouseDown = true;
      event.preventDefault();
      UI.startMouse(audioSystem, glottis, event);
    });
    document.addEventListener("mouseup", function (e) {
      UI.mouseDown = false;
      UI.endMouse(glottis, e);
    });
    document.addEventListener("mousemove", (e) => UI.moveMouse(glottis, e));
  },

  draw: function (tractCtx: CanvasRenderingContext2D, audioSystem: Snail) {
    draw(this.alwaysVoiceButton, tractCtx);
    draw(this.autoWobbleButton, tractCtx);
    draw(this.aboutButton, tractCtx);
    if (this.inAboutScreen) this.drawAboutScreen(tractCtx);
    else if (this.inInstructionsScreen)
      this.drawInstructionsScreen(tractCtx, audioSystem);
  },

  drawAboutScreen: function (tractCtx: CanvasRenderingContext2D) {
    var ctx = tractCtx;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "white";
    ctx.rect(0, 0, 600, 600);
    ctx.fill();

    this.drawAboutText(tractCtx);
  },

  drawAboutText: function (tractCtx: CanvasRenderingContext2D) {
    var ctx = tractCtx;
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#C070C6";
    ctx.strokeStyle = "#C070C6";
    ctx.font = "50px Arial";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.strokeText("P i n k   T r o m b o n e", 300, 230);
    ctx.fillText("P i n k   T r o m b o n e", 300, 230);

    ctx.font = "28px Arial";
    ctx.fillText("bare-handed  speech synthesis", 300, 330);

    ctx.font = "20px Arial";
    //ctx.fillText("(tap to start)", 300, 380);

    if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
      ctx.font = "20px Arial";
      ctx.fillText(
        "(sorry - may work poorly with the Firefox browser)",
        300,
        430,
      );
    }
  },

  drawInstructionsScreen: function (
    tractCtx: CanvasRenderingContext2D,
    audioSystem: Snail,
  ) {
    mute(audioSystem);
    var ctx = tractCtx;
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "white";
    ctx.rect(0, 0, 600, 600);
    ctx.fill();

    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "#C070C6";
    ctx.strokeStyle = "#C070C6";
    ctx.font = "24px Arial";
    ctx.lineWidth = 2;
    ctx.textAlign = "center";

    ctx.font = "19px Arial";
    ctx.textAlign = "left";
    this.instructionsLine = 0;
    this.write(
      tractCtx,
      "Sound is generated in the glottis (at the bottom left) then ",
    );
    this.write(
      tractCtx,
      "filtered by the shape of the vocal tract. The voicebox ",
    );
    this.write(
      tractCtx,
      "controls the pitch and intensity of the initial sound.",
    );
    this.write(tractCtx, "");
    this.write(tractCtx, "Then, to talk:");
    this.write(tractCtx, "");
    this.write(tractCtx, "- move the body of the tongue to shape vowels");
    this.write(tractCtx, "");
    this.write(
      tractCtx,
      "- touch the oral cavity to narrow it, for fricative consonants",
    );
    this.write(tractCtx, "");
    this.write(
      tractCtx,
      "- touch above the oral cavity to close it, for stop consonants",
    );
    this.write(tractCtx, "");
    this.write(
      tractCtx,
      "- touch the nasal cavity to open the velum and let sound ",
    );
    this.write(tractCtx, "   flow through the nose.");
    this.write(tractCtx, "");
    this.write(tractCtx, "");
    this.write(tractCtx, "(tap anywhere to continue)");

    ctx.textAlign = "center";
    ctx.fillText("[tap here to RESET]", 470, 535);

    this.instructionsLine = 18.8;
    ctx.textAlign = "left";
    this.write(tractCtx, "Pink Trombone v1.1");
    this.write(tractCtx, "by Neil Thapen");
    ctx.fillStyle = "blue";
    ctx.globalAlpha = 0.6;
    this.write(tractCtx, "venuspatrol.nfshost.com");

    /*ctx.beginPath();
        ctx.rect(35, 535, 230, 35);
        ctx.rect(370, 505, 200, 50);
        ctx.fill();*/

    ctx.globalAlpha = 1.0;
  },

  instructionsScreenHandleTouch: function (audioSystem: Snail, x, y) {
    if (x >= 35 && x <= 265 && y >= 535 && y <= 570)
      window.location.href = "http://venuspatrol.nfshost.com";
    else if (x >= 370 && x <= 570 && y >= 505 && y <= 555)
      location.reload(false);
    else {
      UI.inInstructionsScreen = false;
      UI.aboutButton.isOn = true;
      unmute(audioSystem);
    }
  },

  write: function (tractCtx: CanvasRenderingContext2D, text: string) {
    tractCtx.fillText(text, 50, 100 + this.instructionsLine * 22);
    this.instructionsLine += 1;
    if (text == "") this.instructionsLine -= 0.3;
  },

  buttonsHandleTouchStart: function (touch) {
    handleTouchStart(this.alwaysVoiceButton, touch);
    this.alwaysVoice = this.alwaysVoiceButton.isOn;
    handleTouchStart(this.autoWobbleButton, touch);
    this.autoWobble = this.autoWobbleButton.isOn;
    handleTouchStart(this.aboutButton, touch);
  },

  startMouse: function (
    audioSystem: Snail,
    glottis: Throat,
    event: PointerEvent,
  ) {
    if (!audioSystem.isStarted) {
      audioSystem.isStarted = true;
      startSound(audioSystem, glottis);
    }
    if (UI.inAboutScreen) {
      UI.inAboutScreen = false;
      return;
    }
    if (UI.inInstructionsScreen) {
      var x = ((event.pageX - tractCanvas.offsetLeft) / UI.width) * 600;
      var y = ((event.pageY - tractCanvas.offsetTop) / UI.width) * 600;
      UI.instructionsScreenHandleTouch(audioSystem, x, y);
      return;
    }

    var touch = {};
    touch.startTime = performance.now() / 1000;
    touch.fricative_intensity = 0;
    touch.endTime = 0;
    touch.alive = true;
    touch.id = "mouse" + Math.random();
    touch.x = ((event.pageX - tractCanvas.offsetLeft) / UI.width) * 600;
    touch.y = ((event.pageY - tractCanvas.offsetTop) / UI.width) * 600;
    touch.index = TractUI.getIndex(touch.x, touch.y);
    touch.diameter = TractUI.getDiameter(touch.x, touch.y);
    UI.mouseTouch = touch;
    UI.touchesWithMouse.push(touch);
    UI.buttonsHandleTouchStart(touch);
    UI.handleTouches(glottis);
  },

  moveMouse: function (glottis: Throat, e: PointerEvent) {
    var touch = UI.mouseTouch;
    if (!touch.alive) return;
    touch.x = ((e.pageX - tractCanvas.offsetLeft) / UI.width) * 600;
    touch.y = ((e.pageY - tractCanvas.offsetTop) / UI.width) * 600;
    touch.index = TractUI.getIndex(touch.x, touch.y);
    touch.diameter = TractUI.getDiameter(touch.x, touch.y);
    UI.handleTouches(glottis);
  },

  endMouse: function (glottis: Throat) {
    var touch = UI.mouseTouch;
    if (!touch.alive) return;
    touch.alive = false;
    touch.endTime = performance.now() / 1000;
    UI.handleTouches(glottis);

    if (!UI.aboutButton.isOn) UI.inInstructionsScreen = true;
  },

  handleTouches: function (glottis: Throat) {
    TractUI.handleTouches();
    handleTouches(glottis);
  },

  updateTouches: function () {
    var fricativeAttackTime = 0.1;
    for (var j = UI.touchesWithMouse.length - 1; j >= 0; j--) {
      var touch = UI.touchesWithMouse[j];
      const time = performance.now() / 1000;
      if (!touch.alive && time > touch.endTime + 1) {
        UI.touchesWithMouse.splice(j, 1);
      } else if (touch.alive) {
        touch.fricative_intensity = clamp(
          (time - touch.startTime) / fricativeAttackTime,
          0,
          1,
        );
      } else {
        touch.fricative_intensity = clamp(
          1 - (time - touch.endTime) / fricativeAttackTime,
          0,
          1,
        );
      }
    }
  },

  shapeToFitScreen: function () {
    if (window.innerWidth <= window.innerHeight) {
      this.width = window.innerWidth - 10;
      this.left_margin = 5;
      this.top_margin = 0.5 * (window.innerHeight - this.width);
    } else {
      this.width = window.innerHeight - 10;
      this.left_margin = 0.5 * (window.innerWidth - this.width);
      this.top_margin = 5;
    }
    document.body.style.marginLeft = this.left_margin.toString();
    document.body.style.marginTop = this.top_margin.toString();
    tractCanvas.style.width = this.width;
    backCanvas.style.width = this.width;
  },
};
