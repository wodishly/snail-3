import type { Being } from "./being";
import { sinews, type Brain, type SinewKind } from "./brain";
import type { Flesh } from "./flesh";
import { row, sameshift } from "./help/list";
import { Settings } from "./settings";

export type Songboard = {
  table: HTMLTableElement;
} & Record<
  SinewKind | "time",
  {
    tr: HTMLTableRowElement;
    th: HTMLTableCellElement;
    tds: HTMLTableCellElement[];
  }
>;

export const makeSongboard = (brainDiv: HTMLDivElement): Songboard => {
  const table = document.createElement("table");
  table.id = "songboard";
  brainDiv.append(table);

  const [lip, tongue, sail, lung] = row(4, (i) => {
    const tr = table.insertRow();
    return {
      tr,
      th: insertTh(tr, sinews[i]),
      tds: [],
    };
  });
  const tr = table.insertRow();
  const time = { tr, th: insertTh(tr, "t"), tds: [] };

  return { table, lip, tongue, sail, lung, time };
};

const insertTh = (tr: HTMLTableRowElement, innerHTML: string = "") => {
  const th = document.createElement("th");
  th.innerHTML = innerHTML;
  tr.appendChild(th);
  return th;
};

export const loadSpellboard = (
  { html: { songboard } }: Flesh,
  brain: Brain,
) => {
  for (const kind of sinews) {
    songboard[kind].tr.replaceChildren();
    if (brain.spell?.length ?? 0 > 0) {
      songboard[kind].tds = sameshift(
        brain.sinews[kind].unbegun,
        (streaming) => {
          const td = document.createElement("td");
          td.innerHTML = streaming.goal?.staff ?? "";
          return td;
        },
      );
    }

    songboard[kind].tr.replaceChildren(
      songboard[kind].th,
      ...songboard[kind].tds,
    );
  }

  songboard.time.tds = row(brain.spell?.length ?? 0, () =>
    document.createElement("td"),
  );
  songboard.time.tr.replaceChildren(songboard.time.th, ...songboard.time.tds);
};

export const stepSpell = (being: Being) => {
  const {
    now,
    brain,
    flesh: {
      html: { songboard },
    },
  } = being;

  const then = brain.sinews.tongue.done[0]?.startTime ?? now;
  const n = Math.floor((now - then) / Settings.beat);

  songboard.time.tr.replaceChildren(
    songboard.time.th,
    ...row(songboard.time.tds.length, (i) => {
      const td = document.createElement("td");
      td.innerHTML = i === n ? "^" : "";
      return td;
    }),
  );
};
