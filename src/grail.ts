import { finishTractBlock, runTractStep, Tract } from "./gract";
import { finishGlottisBlock, Glottis, runGlottisStep } from "./grottis";
import { Fastenings } from "./settings";

export type AudioSystemType = typeof AudioSystem;

export const AudioSystem = {
  started: false,
  soundOn: false,
  sampleRate: -1,
  blockTime: 1,
};

export const initAudioSystem = (audioSystem: AudioSystemType) => {
  audioSystem.audioContext = new AudioContext();
  audioSystem.sampleRate = audioSystem.audioContext.sampleRate;

  audioSystem.blockTime = Fastenings.blockLength / audioSystem.sampleRate;
};

export const mute = (audioSystem: AudioSystemType) => {
  audioSystem.scriptProcessor.disconnect();
};

export const unmute = (audioSystem: AudioSystemType) => {
  audioSystem.scriptProcessor.connect(audioSystem.audioContext.destination);
};

export const doScriptProcessor = (event: AudioProcessingEvent) => {
  var inputArray1 = event.inputBuffer.getChannelData(0);
  var inputArray2 = event.inputBuffer.getChannelData(1);
  var outArray = event.outputBuffer.getChannelData(0);
  for (var j = 0, N = outArray.length; j < N; j++) {
    var lambda1 = j / N;
    var lambda2 = (j + 0.5) / N;
    var glottalOutput = runGlottisStep(Glottis, lambda1, inputArray1[j]);

    var vocalOutput = 0;
    //Tract runs at twice the sample rate
    runTractStep(Tract, glottalOutput, inputArray2[j], lambda1);
    vocalOutput += Tract.lipOutput + Tract.noseOutput;
    runTractStep(Tract, glottalOutput, inputArray2[j], lambda2);
    vocalOutput += Tract.lipOutput + Tract.noseOutput;
    outArray[j] = vocalOutput * 0.125;
  }
  finishGlottisBlock(Glottis);
  finishTractBlock(Tract);
};

export const createWhiteNoiseNode = (
  audioSystem: AudioSystemType,
  frameCount: number,
) => {
  const myArrayBuffer = audioSystem.audioContext.createBuffer(
    1,
    frameCount,
    audioSystem.sampleRate,
  );

  const nowBuffering = myArrayBuffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    nowBuffering[i] = Math.random();
  }

  const source = audioSystem.audioContext.createBufferSource();
  source.buffer = myArrayBuffer;
  source.loop = true;

  return source;
};

export const startSound = (audioSystem: AudioSystemType) => {
  //scriptProcessor may need a dummy input channel on iOS
  audioSystem.scriptProcessor = audioSystem.audioContext.createScriptProcessor(
    Fastenings.blockLength,
    2,
    1,
  );
  audioSystem.scriptProcessor.connect(audioSystem.audioContext.destination);
  audioSystem.scriptProcessor.onaudioprocess = doScriptProcessor;

  var whiteNoise = createWhiteNoiseNode(
    audioSystem,
    2 * audioSystem.sampleRate,
  ); // 2 seconds of noise

  var aspirateFilter = audioSystem.audioContext.createBiquadFilter();
  aspirateFilter.type = "bandpass";
  aspirateFilter.frequency.value = 500;
  aspirateFilter.Q.value = 0.5;
  whiteNoise.connect(aspirateFilter);
  aspirateFilter.connect(audioSystem.scriptProcessor);

  var fricativeFilter = audioSystem.audioContext.createBiquadFilter();
  fricativeFilter.type = "bandpass";
  fricativeFilter.frequency.value = 1000;
  fricativeFilter.Q.value = 0.5;
  whiteNoise.connect(fricativeFilter);
  fricativeFilter.connect(audioSystem.scriptProcessor);

  whiteNoise.start(0);
};
