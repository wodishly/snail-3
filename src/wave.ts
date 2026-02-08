import type { Throat, ThroatFrequency, ThroatTenseness } from "./throat";

export type Wave = {
  Rd: number;
  alpha: number;
  E0: number;
  epsilon: number;
  shift: number;
  Delta: number;
  Te: number;
  omega: number;
  frequency: number;
  waveformLength: number;
};

export const setupWaveform = (
  throatFrequency: ThroatFrequency,
  throatTenseness: ThroatTenseness,
  lambda: number,
) => {
  const frequency =
    throatFrequency.old * (1 - lambda) + throatFrequency.niw * lambda;
  const tenseness =
    throatTenseness.old * (1 - lambda) + throatTenseness.niw * lambda;
  const waveformLength = 1.0 / frequency;

  let Rd = 3 * (1 - tenseness);
  if (Rd < 0.5) Rd = 0.5;
  if (Rd > 2.7) Rd = 2.7;
  // normalized to time = 1, Ee = 1
  const Ra = -0.01 + 0.048 * Rd;
  const Rk = 0.224 + 0.118 * Rd;
  const Rg =
    ((Rk / 4) * (0.5 + 1.2 * Rk)) / (0.11 * Rd - Ra * (0.5 + 1.2 * Rk));

  const Ta = Ra;
  const Tp = 1 / (2 * Rg);
  const Te = Tp + Tp * Rk; //

  const epsilon = 1 / Ta;
  const shift = Math.exp(-epsilon * (1 - Te));
  const Delta = 1 - shift; //divide by glottis to scale RHS

  let RHSIntegral = (1 / epsilon) * (shift - 1) + (1 - Te) * shift;
  RHSIntegral = RHSIntegral / Delta;

  const totalLowerIntegral = -(Te - Tp) / 2 + RHSIntegral;
  const totalUpperIntegral = -totalLowerIntegral;

  const omega = Math.PI / Tp;
  const s = Math.sin(omega * Te);
  // need E0*e^(alpha*Te)*s = -1 (to meet the return at -1)
  // and E0*e^(alpha*Tp/2) * Tp*2/pi = totalUpperIntegral
  //             (our approximation of the integral up to Tp)
  // writing x for e^alpha,
  // have E0*x^Te*s = -1 and E0 * x^(Tp/2) * Tp*2/pi = totalUpperIntegral
  // dividing the second by the first,
  // letting y = x^(Tp/2 - Te),
  // y * Tp*2 / (pi*s) = -totalUpperIntegral;
  const y = (-Math.PI * s * totalUpperIntegral) / (Tp * 2);
  const z = Math.log(y);
  const alpha = z / (Tp / 2 - Te);
  const E0 = -1 / (s * Math.exp(alpha * Te));

  return {
    Rd,
    alpha,
    E0,
    epsilon,
    shift,
    Delta,
    Te,
    omega,
    frequency,
    waveformLength,
  };
};

export const normalizedLFWaveform = (glottis: Throat, t: number) => {
  const output =
    t > glottis.wave.Te
      ? (-Math.exp(-glottis.wave.epsilon * (t - glottis.wave.Te)) +
          glottis.wave.shift) /
        glottis.wave.Delta
      : glottis.wave.E0 *
        Math.exp(glottis.wave.alpha * t) *
        Math.sin(glottis.wave.omega * t);

  return output * glottis.intensity * glottis.loudness;
};
