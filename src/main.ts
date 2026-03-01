import "./style.css";

import { updateLeech } from "./leech";
import { drawMouthflesh } from "./mouthflesh";
import { updateTouches } from "./flesh";
import { think } from "./brain";
import { stepSpell } from "./songboard";
import { become } from "./being";

window.onload = () => {
  const being = become();

  const redraw = (now: number) => {
    being.now = now;

    drawMouthflesh(being);
    updateTouches(being);

    think(being);
    // console.log(throat.intensity); // todo make it so intensity climbs up to 1 by 0.13 instead of being instant
    updateLeech(being);
    stepSpell(being);
    requestAnimationFrame(redraw);
  };
  requestAnimationFrame(redraw);
};
