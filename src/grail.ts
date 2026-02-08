import { finishTractBlock, runTractStep, Tract } from "./gract";
import { finishGlottisBlock, runGlottisStep, type Throat } from "./grottis";
import { Fastenings } from "./settings";
import type { Maybe } from "./type";

export type Snail = {
  isStarted: boolean;
  isLoud: boolean;
  context: AudioContext;
  processor: Maybe<ScriptProcessorNode>;
};

export const reckonBlockTime = (snail: Snail): number => {
  return Fastenings.blockLength / snail.context.sampleRate;
};

export const makeSnail = (): Snail => {
  const context = new AudioContext();
  return {
    isStarted: false,
    isLoud: false,
    context,
    processor: undefined,
  };
};

export const doScriptProcessor = (
  audioSystem: Snail,
  glottis: Throat,
  event: AudioProcessingEvent,
): void => {
  const inputArray1 = event.inputBuffer.getChannelData(0);
  const inputArray2 = event.inputBuffer.getChannelData(1);
  const outArray = event.outputBuffer.getChannelData(0);
  for (let j = 0, N = outArray.length; j < N; j++) {
    const lambda1 = j / N;
    const lambda2 = (j + 0.5) / N;
    const glottalOutput = runGlottisStep(
      glottis,
      audioSystem,
      lambda1,
      inputArray1[j],
    );

    let vocalOutput = 0;
    //Tract runs at twice the sample rate
    runTractStep(
      Tract,
      glottis,
      audioSystem,
      glottalOutput,
      inputArray2[j],
      lambda1,
    );
    vocalOutput += Tract.lipOutput + Tract.noseOutput;
    runTractStep(
      Tract,
      glottis,
      audioSystem,
      glottalOutput,
      inputArray2[j],
      lambda2,
    );
    vocalOutput += Tract.lipOutput + Tract.noseOutput;
    outArray[j] = vocalOutput * 0.125;
  }
  finishGlottisBlock(glottis);
  finishTractBlock(Tract, audioSystem);
};

export const createWhiteNoiseNode = (
  audioSystem: Snail,
  frameCount: number,
): AudioBufferSourceNode => {
  const myArrayBuffer = audioSystem.context.createBuffer(
    1,
    frameCount,
    audioSystem.context.sampleRate,
  );

  const nowBuffering = myArrayBuffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    nowBuffering[i] = Math.random();
  }

  const source = audioSystem.context.createBufferSource();
  source.buffer = myArrayBuffer;
  source.loop = true;

  return source;
};

export const startSound = (audioSystem: Snail, glottis: Throat): void => {
  //scriptProcessor may need a dummy input channel on iOS
  audioSystem.processor = audioSystem.context.createScriptProcessor(
    Fastenings.blockLength,
    2,
    1,
  );
  audioSystem.processor.connect(audioSystem.context.destination);
  audioSystem.processor.onaudioprocess = (e: AudioProcessingEvent) =>
    doScriptProcessor(audioSystem, glottis, e);

  const whiteNoise = createWhiteNoiseNode(
    audioSystem,
    2 * audioSystem.context.sampleRate,
  ); // 2 seconds of noise

  const aspirateFilter = audioSystem.context.createBiquadFilter();
  aspirateFilter.type = "bandpass";
  aspirateFilter.frequency.value = 500;
  aspirateFilter.Q.value = 0.5;
  whiteNoise.connect(aspirateFilter);
  aspirateFilter.connect(audioSystem.processor);

  const fricativeFilter = audioSystem.context.createBiquadFilter();
  fricativeFilter.type = "bandpass";
  fricativeFilter.frequency.value = 1000;
  fricativeFilter.Q.value = 0.5;
  whiteNoise.connect(fricativeFilter);
  fricativeFilter.connect(audioSystem.processor);

  whiteNoise.start(0);
};

export const mute = (audioSystem: Snail): void => {
  audioSystem.processor!.disconnect();
};

export const unmute = (audioSystem: Snail): void => {
  audioSystem.processor!.connect(audioSystem.context.destination);
};
