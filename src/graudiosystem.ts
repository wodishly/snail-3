import { Tract } from "./gract";
import { Glottis } from "./grottis";
import { Fastenings } from "./settings";

export type AudioSystem = typeof AudioSystem;

export const AudioSystem = {
  blockLength: 512,
  started: false,
  soundOn: false,
  sampleRate: -1,
  blockTime: 1,

  init: function () {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new window.AudioContext();
    this.sampleRate = this.audioContext.sampleRate;

    this.blockTime = Fastenings.blockLength / this.sampleRate;
  },

  startSound: function () {
    //scriptProcessor may need a dummy input channel on iOS
    this.scriptProcessor = this.audioContext.createScriptProcessor(
      this.blockLength,
      2,
      1,
    );
    this.scriptProcessor.connect(this.audioContext.destination);
    this.scriptProcessor.onaudioprocess = AudioSystem.doScriptProcessor;

    var whiteNoise = this.createWhiteNoiseNode(2 * this.sampleRate); // 2 seconds of noise

    var aspirateFilter = this.audioContext.createBiquadFilter();
    aspirateFilter.type = "bandpass";
    aspirateFilter.frequency.value = 500;
    aspirateFilter.Q.value = 0.5;
    whiteNoise.connect(aspirateFilter);
    aspirateFilter.connect(this.scriptProcessor);

    var fricativeFilter = this.audioContext.createBiquadFilter();
    fricativeFilter.type = "bandpass";
    fricativeFilter.frequency.value = 1000;
    fricativeFilter.Q.value = 0.5;
    whiteNoise.connect(fricativeFilter);
    fricativeFilter.connect(this.scriptProcessor);

    whiteNoise.start(0);
  },

  createWhiteNoiseNode: function (frameCount) {
    var myArrayBuffer = this.audioContext.createBuffer(
      1,
      frameCount,
      this.sampleRate,
    );

    var nowBuffering = myArrayBuffer.getChannelData(0);
    for (var i = 0; i < frameCount; i++) {
      nowBuffering[i] = Math.random(); // gaussian();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = myArrayBuffer;
    source.loop = true;

    return source;
  },

  doScriptProcessor: function (event) {
    var inputArray1 = event.inputBuffer.getChannelData(0);
    var inputArray2 = event.inputBuffer.getChannelData(1);
    var outArray = event.outputBuffer.getChannelData(0);
    for (var j = 0, N = outArray.length; j < N; j++) {
      var lambda1 = j / N;
      var lambda2 = (j + 0.5) / N;
      var glottalOutput = Glottis.runStep(lambda1, inputArray1[j]);

      var vocalOutput = 0;
      //Tract runs at twice the sample rate
      Tract.runStep(glottalOutput, inputArray2[j], lambda1);
      vocalOutput += Tract.lipOutput + Tract.noseOutput;
      Tract.runStep(glottalOutput, inputArray2[j], lambda2);
      vocalOutput += Tract.lipOutput + Tract.noseOutput;
      outArray[j] = vocalOutput * 0.125;
    }
    Glottis.finishBlock();
    Tract.finishBlock();
  },
};

export const mute = (audioSystem: AudioSystem) => {
  audioSystem.scriptProcessor.disconnect();
};

export const unmute = (audioSystem: AudioSystem) => {
  audioSystem.scriptProcessor.connect(audioSystem.audioContext.destination);
};
