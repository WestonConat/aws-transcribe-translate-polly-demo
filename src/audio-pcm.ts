// audio-pcm.ts
export class PCMRecorder {
    private audioContext: AudioContext | null = null;
    private sourceNode: MediaStreamAudioSourceNode | null = null;
    private processorNode: ScriptProcessorNode | null = null;
    private stream: MediaStream | null = null;
    public onPcmData: ((pcmChunk: Int16Array) => void) | null = null;
  
    /**
     * Start capturing raw PCM audio. If a deviceId is provided, we constrain
     * getUserMedia to that device.
     */
    async start(deviceId?: string) {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true
      };
  
      // 1) Get the mic stream (with optional deviceId)
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
  
      // 2) Create an AudioContext
      this.audioContext = new AudioContext();
  
      // 3) Create a MediaStreamAudioSourceNode from the mic
      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
  
      // 4) Create a ScriptProcessorNode
      const bufferSize = 4096;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
  
      // 5) Handle audio processing
      this.processorNode.onaudioprocess = (audioEvent: AudioProcessingEvent) => {
        const inputBuffer = audioEvent.inputBuffer;
        const rawData = inputBuffer.getChannelData(0);
  
        // ...downsample logic from previous examples
        const downsampledData = downsampleBuffer(rawData, inputBuffer.sampleRate, 16000);
  
        if (downsampledData && this.onPcmData) {
          this.onPcmData(downsampledData);
        }
      };
  
      // 6) Connect the nodes
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
  
      console.log('[PCMRecorder] Recording started using deviceId:', deviceId || 'default');
    }
  
    stop() {
      // same as before: stop tracks, close context, etc.
    }
  }
  
  /**
   * Takes a Float32Array (e.g. 44.1kHz or 48kHz),
   * down-samples it to 16kHz, and returns an Int16Array.
   */
  export function downsampleBuffer(
    float32Data: Float32Array,
    originalSampleRate: number,
    targetSampleRate: number
  ): Int16Array | null {
    if (targetSampleRate > originalSampleRate) {
      console.warn(
        '[downsampleBuffer] Target sample rate is higher than original sample rate.'
      );
      return null;
    }
  
    const ratio = originalSampleRate / targetSampleRate;
    const newLength = Math.round(float32Data.length / ratio);
    const downsampledData = new Int16Array(newLength);
  
    let offsetResult = 0;
    let offsetBuffer = 0;
  
    while (offsetResult < newLength) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      // Average the samples between offsetBuffer and nextOffsetBuffer
      let sum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < float32Data.length; i++) {
        sum += float32Data[i];
        count++;
      }
      const sample = sum / count;
  
      // Convert float sample (range -1..1) to 16-bit PCM (range -32768..32767)
      downsampledData[offsetResult] = sample < 0
        ? sample * 32768
        : sample * 32767;
  
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
  
    return downsampledData;
  }
  