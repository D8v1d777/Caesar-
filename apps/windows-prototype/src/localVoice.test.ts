import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodeMonoPcm16Wav,
  getLocalSpeechStatus,
  resampleMonoAudio,
  transcribeLocalWav,
} from "./localVoice";

function mockResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("local audio encoding", () => {
  it("resamples mono audio to the required 16 kHz sample count", () => {
    const input = new Float32Array(48000).fill(0.25);
    const output = resampleMonoAudio(input, 48000, 16000);
    expect(output).toHaveLength(16000);
    expect(output[0]).toBeCloseTo(0.25);
    expect(output[output.length - 1]).toBeCloseTo(0.25);
  });

  it("copies samples when no resampling is required", () => {
    const input = new Float32Array([-1, 0, 1]);
    const output = resampleMonoAudio(input, 16000, 16000);
    expect(output).toEqual(input);
    expect(output).not.toBe(input);
  });

  it("rejects invalid rates", () => {
    expect(() => resampleMonoAudio(new Float32Array([0]), 0)).toThrow(/sample rates/i);
  });

  it("writes a standards-shaped mono 16-bit PCM WAV header", () => {
    const wav = encodeMonoPcm16Wav(new Float32Array([-1, 0, 1]));
    const view = new DataView(wav);
    const ascii = (start: number, count: number) =>
      Array.from({ length: count }, (_, i) => String.fromCharCode(view.getUint8(start + i))).join("");
    expect(ascii(0, 4)).toBe("RIFF");
    expect(ascii(8, 4)).toBe("WAVE");
    expect(ascii(12, 4)).toBe("fmt ");
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(36, 4)).toBe("data");
    expect(view.getUint32(40, true)).toBe(6);
    expect(wav.byteLength).toBe(50);
    expect(view.getInt16(44, true)).toBe(-32768);
    expect(view.getInt16(48, true)).toBe(32767);
  });
});

describe("local speech API client", () => {
  it("reads the local runtime status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({
      available: false,
      reason: "not_configured",
      message: "Local speech is not configured.",
    })));
    await expect(getLocalSpeechStatus()).resolves.toEqual({
      available: false,
      reason: "not_configured",
      message: "Local speech is not configured.",
    });
  });

  it("sends WAV as multipart form data to the local endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(mockResponse({
      transcript: "Show quarterly revenue",
      engine: "whisper.cpp",
      processing: "local",
      audio_retained: false,
    }));
    vi.stubGlobal("fetch", fetchMock);
    const wav = new Blob([encodeMonoPcm16Wav(new Float32Array([0, 0]))], { type: "audio/wav" });

    await expect(transcribeLocalWav(wav)).resolves.toEqual({
      transcript: "Show quarterly revenue",
      engine: "whisper.cpp",
      processing: "local",
      audio_retained: false,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/local/speech/transcribe");
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("audio")).toBeInstanceOf(Blob);
  });

  it("rejects a remote/non-local transcription result", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({
      transcript: "Do something",
      engine: "cloud",
      processing: "remote",
      audio_retained: true,
    })));
    await expect(transcribeLocalWav(new Blob(["x"], { type: "audio/wav" })))
      .rejects.toThrow(/invalid response/i);
  });

  it("reports a local API failure without any cloud fallback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse({ detail: "Model checksum mismatch." }, 503)));
    await expect(transcribeLocalWav(new Blob(["x"], { type: "audio/wav" })))
      .rejects.toThrow(/checksum mismatch/i);
  });
});
