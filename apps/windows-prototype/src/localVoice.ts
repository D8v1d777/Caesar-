export const TARGET_SAMPLE_RATE = 16_000;
export const MAX_CAPTURE_SECONDS = 30;

export type LocalSpeechStatus = {
  available: boolean;
  reason: string;
  message: string;
};

export type LocalTranscription = {
  transcript: string;
  engine: "whisper.cpp";
  processing: "local";
  audio_retained: false;
};

export type LocalAudioCapture = {
  stop(): Promise<Blob>;
  cancel(): Promise<void>;
};

function errorName(error: unknown): string {
  return typeof error === "object" && error !== null && "name" in error
    ? String((error as { name: unknown }).name)
    : "";
}

export function resampleMonoAudio(
  input: Float32Array,
  sourceRate: number,
  targetRate = TARGET_SAMPLE_RATE,
): Float32Array {
  if (!Number.isFinite(sourceRate) || sourceRate <= 0 || !Number.isFinite(targetRate) || targetRate <= 0) {
    throw new Error("Sample rates must be positive finite numbers.");
  }
  if (input.length === 0) return new Float32Array(0);
  if (sourceRate === targetRate) return input.slice();

  const outputLength = Math.floor((input.length * targetRate) / sourceRate);
  const output = new Float32Array(outputLength);
  const ratio = sourceRate / targetRate;
  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(left + 1, input.length - 1);
    const blend = position - left;
    output[index] = input[left] * (1 - blend) + input[right] * blend;
  }
  return output;
}

export function encodeMonoPcm16Wav(samples: Float32Array, sampleRate = TARGET_SAMPLE_RATE): ArrayBuffer {
  if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new Error("WAV sample rate must be a positive integer.");
  }
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };

  writeAscii(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(8, "WAVE");
  writeAscii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (const sample of samples) {
    const clamped = Math.max(-1, Math.min(1, sample));
    const pcm = clamped < 0 ? Math.round(clamped * 0x8000) : Math.round(clamped * 0x7fff);
    view.setInt16(offset, pcm, true);
    offset += bytesPerSample;
  }
  return buffer;
}

export async function startLocalAudioCapture(
  onMaxDurationReached?: () => void,
): Promise<LocalAudioCapture> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support local microphone capture.");
  }
  if (typeof AudioContext === "undefined") {
    throw new Error("This browser does not support the required local audio processing.");
  }

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
  } catch (error) {
    const name = errorName(error);
    if (name === "NotAllowedError" || name === "SecurityError") {
      throw new Error("Microphone permission was denied. Caesar did not capture audio.");
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      throw new Error("No microphone was found. Caesar did not capture audio.");
    }
    throw new Error("Local microphone capture could not be started.");
  }

  let context: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let processor: ScriptProcessorNode | null = null;
  let settled = false;
  let maxDurationNotified = false;
  let totalSamples = 0;
  const chunks: Float32Array[] = [];

  try {
    context = new AudioContext({ latencyHint: "interactive" });
    await context.resume();
    source = context.createMediaStreamSource(stream);
    processor = context.createScriptProcessor(4096, 1, 1);
    const sampleLimit = context.sampleRate * MAX_CAPTURE_SECONDS;

    processor.onaudioprocess = (event: AudioProcessingEvent) => {
      const output = event.outputBuffer.getChannelData(0);
      output.fill(0);
      if (settled) return;

      const input = event.inputBuffer.getChannelData(0);
      const remaining = sampleLimit - totalSamples;
      if (remaining <= 0) {
        if (!maxDurationNotified) {
          maxDurationNotified = true;
          Promise.resolve().then(() => onMaxDurationReached?.());
        }
        return;
      }

      const take = Math.min(input.length, remaining);
      chunks.push(input.slice(0, take));
      totalSamples += take;
      if (totalSamples >= sampleLimit && !maxDurationNotified) {
        maxDurationNotified = true;
        Promise.resolve().then(() => onMaxDurationReached?.());
      }
    };

    source.connect(processor);
    processor.connect(context.destination);
  } catch {
    stream.getTracks().forEach(track => track.stop());
    if (context && context.state !== "closed") await context.close().catch(() => undefined);
    throw new Error("Local microphone capture could not be initialized.");
  }

  const sourceSampleRate = context?.sampleRate ?? TARGET_SAMPLE_RATE;
  let stopPromise: Promise<Blob> | null = null;

  const cleanup = async () => {
    if (settled) return;
    settled = true;
    if (processor) {
      processor.onaudioprocess = null;
      processor.disconnect();
    }
    source?.disconnect();
    stream.getTracks().forEach(track => track.stop());
    if (context && context.state !== "closed") await context.close().catch(() => undefined);
  };

  return {
    stop(): Promise<Blob> {
      if (stopPromise) return stopPromise;
      stopPromise = (async () => {
        await cleanup();
        if (totalSamples === 0) throw new Error("No audio was captured.");
        const merged = new Float32Array(totalSamples);
        let offset = 0;
        for (const chunk of chunks) {
          merged.set(chunk, offset);
          offset += chunk.length;
          chunk.fill(0);
        }
        chunks.length = 0;
        const resampled = resampleMonoAudio(merged, sourceSampleRate, TARGET_SAMPLE_RATE);
        merged.fill(0);
        if (resampled.length === 0) throw new Error("The captured audio was too short to transcribe.");
        const wav = encodeMonoPcm16Wav(resampled, TARGET_SAMPLE_RATE);
        resampled.fill(0);
        return new Blob([wav], { type: "audio/wav" });
      })();
      return stopPromise;
    },
    async cancel(): Promise<void> {
      await cleanup();
      for (const chunk of chunks) chunk.fill(0);
      chunks.length = 0;
      totalSamples = 0;
    },
  };
}

function isLocalSpeechStatus(value: unknown): value is LocalSpeechStatus {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  return typeof body.available === "boolean" &&
    typeof body.reason === "string" &&
    typeof body.message === "string";
}

export async function getLocalSpeechStatus(): Promise<LocalSpeechStatus> {
  let response: Response;
  try {
    response = await fetch("/api/v1/local/speech/status", { method: "GET", cache: "no-store" });
  } catch {
    throw new Error("Local speech API is unreachable. Start the API bound to 127.0.0.1:8000.");
  }
  if (!response.ok) throw new Error("Local speech status check failed (HTTP " + response.status + ").");

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("Local speech status returned unreadable data.");
  }
  if (!isLocalSpeechStatus(body)) throw new Error("Local speech status returned an invalid response.");
  return body;
}

function isLocalTranscription(value: unknown): value is LocalTranscription {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Record<string, unknown>;
  return typeof body.transcript === "string" &&
    body.transcript.trim().length > 0 &&
    body.engine === "whisper.cpp" &&
    body.processing === "local" &&
    body.audio_retained === false;
}

export async function transcribeLocalWav(wav: Blob): Promise<LocalTranscription> {
  const form = new FormData();
  form.append("audio", wav, "caesar-voice.wav");

  let response: Response;
  try {
    response = await fetch("/api/v1/local/speech/transcribe", { method: "POST", body: form });
  } catch {
    throw new Error("Local transcription service is unreachable. Audio was not sent to a cloud provider.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("Local transcription service returned unreadable data.");
  }

  if (!response.ok) {
    const detail = typeof body === "object" && body !== null && "detail" in body
      ? (body as { detail?: unknown }).detail
      : null;
    throw new Error(typeof detail === "string" ? detail : "Local transcription failed (HTTP " + response.status + ").");
  }
  if (!isLocalTranscription(body)) {
    throw new Error("Local transcription returned an invalid response; the transcript was not accepted.");
  }
  return { ...body, transcript: body.transcript.trim() };
}
