import { Settings } from "./settings";

export type Sievename = keyof typeof Settings.sieve;

export type Sieveful<N extends Sievename = Sievename> = {
  name: N;
  sieve: BiquadFilterNode;
};

/**
 * Makes a new {@link BiquadFilterNode} of name {@link Sievename},
 * and links it to the given {@link AudioContext}.
 */
export const makeSieveful = <N extends Sievename>(
  context: AudioContext,
  name: N,
): Sieveful<N> => {
  const sieve = context.createBiquadFilter();
  sieve.type = "bandpass";
  sieve.frequency.value = Settings.sieve[name].sharpness;
  sieve.Q.value = 0.5;
  sieve.connect(context.destination);
  return { name, sieve };
};
