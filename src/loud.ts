import type { Sinewing } from "./brain";
import type { Maybe, Json, Span } from "./help/type";
import type { Tongue } from "./rine";
import { Fastenings } from "./settings";
import {
  isBlade,
  isLip,
  isNosed,
  isRinged,
  isStaved,
  type Loudstaff,
} from "./tung/staff";

export type Loud<S extends Loudstaff = Loudstaff> = Json & {
  staff: S;

  /** `undefined` iff `this` is yet to be uttered */
  time: Maybe<Span>;
};

export const loudToSinewing = (staff: Loudstaff): Sinewing => {
  return {
    lip: {
      width: isLip(staff)
        ? isRinged(staff)
          ? Fastenings.lip.ring
          : 0
        : Fastenings.lip.unring,
    },
    tongue: bleh(staff),
    sail: {
      width: isNosed(staff) ? Fastenings.sail.nosebear : Fastenings.sail.rest,
    },
    lung: {
      strength: +isStaved(staff),
    },
  };
};

const bleh = (staff: Loudstaff): Tongue => {
  if (isBlade(staff)) {
    return { berth: 32, width: 1.5 };
  }
  switch (staff) {
    case "e":
      return { berth: 26, width: 3 };
    case "i":
      return { berth: 29, width: 2 };
    case "o":
      return { berth: 16, width: 2 };
    case "u":
      return { berth: 20.5, width: 2 };
    case "a":
    default:
      return { berth: 13, width: 2.5 };
    // return { berth: tongueMiddle(), width: 2 };
  }
};
