import type { Flesh } from "./flesh";
import type { Show } from "./help/type";
import type { Mouthflesh } from "./mouthflesh";
import type { Song } from "./speak";

export const updateLeech = (
  song: Song,
  flesh: Flesh,
  mouthflesh: Mouthflesh,
) => {
  flesh.html.time.innerHTML = (performance.now() / 1000).toString();
  if (song.loud) {
    flesh.html.loudlist.innerHTML = toLi(
      song.loud,
      (l) => `Now: ${l}`,
    ).outerHTML;
  }
  flesh.html.loudlist.innerHTML += song.staves
    .map((staff) => toLi(staff).outerHTML)
    .join("");
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
