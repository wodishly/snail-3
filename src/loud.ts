import type { Maybe, Json, Span } from "./help/type";
import type { Tongue } from "./rine";
import { tongueMiddle } from "./settings";
import type { Loudstaff } from "./staff";

export interface Loud extends Json {
  staff: Loudstaff;

  /** `undefined` iff `this` is yet to be uttered */
  time: Maybe<Span>;
}

type LoudOf<S extends Loudstaff | undefined> = S extends Loudstaff
  ? Loud
  : undefined;

export const makeLoud = (staff: Maybe<Loudstaff>): LoudOf<typeof staff> => {
  if (staff === undefined) {
    return undefined;
  } else {
    return {
      staff,
      time: undefined,
      toJSON(this: Loud) {
        return this.staff + " " + JSON.stringify(this.time);
      },
    };
  }
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
