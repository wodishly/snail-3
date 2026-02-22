import type { Maybe, Json, Span } from "./help/type";
import type { Tongue } from "./rine";
import { tongueMiddle } from "./settings";
import type { Loudstaff } from "./tung/staff";

export interface Loud<S extends Loudstaff = Loudstaff> extends Json {
  staff: S;

  /** `undefined` iff `this` is yet to be uttered */
  time: Maybe<Span>;
}

export const oldMakeLoud = <S extends Loudstaff>(staff: S): Loud<S> => {
  return {
    staff,
    time: undefined,
    toJSON() {
      return this.staff + " " + JSON.stringify(this.time);
    },
  };
};

export const loudToTongue = (staff: Loudstaff): Tongue => {
  switch (staff) {
    case "a":
      return { berth: 13, width: 2.5 };
    case "e":
      return { berth: 26, width: 3 };
    case "i":
      return { berth: 29, width: 2 };
    case "o":
      return { berth: 16, width: 2 };
    case "u":
      return { berth: 20.5, width: 2 };
    default:
      return { berth: tongueMiddle(), width: 2 };
  }
};
