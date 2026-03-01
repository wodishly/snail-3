import type { Being } from "./being";
import { maybeList, maybeStringify, type Maybe, type Show } from "./help/type";

export const updateLeech = (being: Being) => {
  const { flesh, mouthflesh } = being;
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

export const log = <T>(x: T, ...xs: any[]): T => {
  console.log(maybeStringify(x), ...xs.map(maybeStringify));
  return x;
};

export const logging = <T>(x: T, aside: Maybe<string> = undefined): T => {
  return log(x, ...maybeList(aside));
};
