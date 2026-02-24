import type { Flesh } from "./flesh";
import type { Show } from "./help/type";
import type { Mouthflesh } from "./mouthflesh";

export const updateLeech = (flesh: Flesh, mouthflesh: Mouthflesh) => {
  flesh.html.time.innerHTML = (performance.now() / 1000).toString();

  // const first = song.loud ? toLi(song.loud, (l) => `Now: ${l}`).outerHTML : "";
  // const rest = song.staves.map((staff) => toLi(staff).outerHTML).join("");
  // flesh.html.loudlist.innerHTML = first + rest;

  flesh.html.rine.innerHTML = JSON.stringify(flesh.rine);

  flesh.html.mouserines.innerHTML = flesh.mouserines
    .map((rine) => toLi(rine).outerHTML)
    .join("");

  mouthflesh.html.rine.innerHTML = JSON.stringify(mouthflesh.rine);
};

const toLi = <T extends Show>(
  x: T,
  shapeshift: (_: string) => string = (x) => x,
): HTMLLIElement => {
  const li = document.createElement("li");
  li.innerHTML = shapeshift(JSON.stringify(x));
  return li;
};
