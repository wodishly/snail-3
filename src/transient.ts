import type { Snail } from "./snail";
import type { Berth, Mouth } from "./tract";

export type Transient = {
  berth: Berth;
  timeAlive: number;
  lifeTime: number;
  strength: number;
  exponent: number;
};

export const makeTransient = (berth: Berth): Transient => {
  return {
    berth,
    timeAlive: 0,
    lifeTime: 0.2,
    strength: 0.3,
    exponent: 200,
  };
};

export const processTransients = (tract: Mouth, snail: Snail) => {
  for (let i = 0; i < tract.transients.length; i++) {
    const transient = tract.transients[i];
    const amplitude =
      transient.strength *
      Math.pow(2, -transient.exponent * transient.timeAlive);
    tract.main[transient.berth].right += amplitude / 2;
    tract.main[transient.berth].left += amplitude / 2;
    transient.timeAlive += 1 / (snail.context.sampleRate * 2);
  }

  for (let i = tract.transients.length - 1; i >= 0; i--) {
    const transient = tract.transients[i];
    if (transient.timeAlive > transient.lifeTime) {
      tract.transients.splice(i, 1);
    }
  }
};
