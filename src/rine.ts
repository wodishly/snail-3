import { canvasToTongue } from "./canvas";
import type { Z } from "./help/math";
import { deepRound } from "./help/rime";
import type { Maybe, Json, Span } from "./help/type";

export type Rinemake = (z: Z) => Rine;
export type RineId<N extends number = number> = `mouse${N}`;

export type Width = {
  width: number;
};

export type Tongue = Width & {
  berth: number;
};

export type Rine<B extends boolean = boolean> = Z &
  Json &
  Tongue & {
    id: RineId;
    time: Span;
    isDown: B;

    /** fricativeIntensity */
    fi: number;
  };

export type Rineful = {
  rine: Maybe<Rine>;
};

export const unrine = (id: RineId): Omit<Rine, keyof Z | "berth" | "width"> => {
  return {
    id,
    time: { start: performance.now() / 1000, end: 0 },
    fi: 0,
    isDown: true,
    toJSON(this: Rine) {
      const rounded = deepRound(this);
      return (
        `${rounded.id}:` +
        ` (${rounded.x}, ${rounded.y})` +
        ` [${rounded.berth}:${rounded.width}]`
      );
    },
  };
};

export const makeRinemake = (): Rinemake => {
  let rineId = 0;
  return (z: Z): Rine => {
    return {
      ...z,
      ...canvasToTongue(z),
      ...unrine(`mouse${++rineId}`),
    };
  };
};
