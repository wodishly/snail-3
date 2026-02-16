import type { Flesh } from "./flesh";
import type { Mouthflesh } from "./mouthflesh";

export const updateLeech = (flesh: Flesh, mouthflesh: Mouthflesh) => {
  flesh.html.mouseTouch.innerHTML = JSON.stringify(flesh.rine);
  flesh.html.mouserines.innerHTML = flesh.mouserines
    .map((rine) => {
      const li = document.createElement("li");
      li.innerHTML = JSON.stringify(rine);
      return li.outerHTML;
    })
    .join("");
  mouthflesh.html.tongueRine.innerHTML = JSON.stringify(mouthflesh.tongueRine);
};
