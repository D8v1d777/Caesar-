import { describe, expect, it } from "vitest";
import {
  initialVoiceSessionState,
  transitionVoiceSession,
  type VoiceSessionState,
} from "./voiceSession";

describe("voice session safety contract", () => {
  it("starts unavailable until a trusted local runtime is present", () => {
    expect(initialVoiceSessionState).toEqual({
      status: "unavailable",
      reason: "local_runtime_missing",
    });
    expect(transitionVoiceSession(initialVoiceSessionState, { type: "start_requested" }))
      .toEqual(initialVoiceSessionState);
  });

  it("requests permission before entering the listening state", () => {
    const idle = transitionVoiceSession(initialVoiceSessionState, { type: "runtime_ready" });
    const requesting = transitionVoiceSession(idle, { type: "start_requested" });
    expect(requesting.status).toBe("requesting_permission");
    expect(transitionVoiceSession(requesting, { type: "permission_granted" }).status).toBe("listening");
  });

  it("moves to an actionable error when permission is denied", () => {
    const requesting: VoiceSessionState = { status: "requesting_permission" };
    expect(transitionVoiceSession(requesting, { type: "permission_denied", message: " " }))
      .toEqual({ status: "error", message: "Microphone permission was denied." });
  });

  it("only accepts a transcript after capture stops and local transcription completes", () => {
    const listening: VoiceSessionState = { status: "listening" };
    const transcribing = transitionVoiceSession(listening, { type: "audio_stopped" });
    expect(transcribing).toEqual({ status: "transcribing" });
    expect(transitionVoiceSession(transcribing, {
      type: "transcription_succeeded",
      transcript: "  Show quarterly revenue  ",
    })).toEqual({ status: "transcript_ready", transcript: "Show quarterly revenue" });
  });

  it("fails closed on empty speech output", () => {
    const transcribing: VoiceSessionState = { status: "transcribing" };
    expect(transitionVoiceSession(transcribing, { type: "transcription_succeeded", transcript: "  " }))
      .toEqual({ status: "error", message: "No speech was recognized." });
  });

  it("does not allow out-of-order events to skip permission or capture", () => {
    const idle: VoiceSessionState = { status: "idle" };
    expect(transitionVoiceSession(idle, { type: "permission_granted" })).toEqual(idle);
    expect(transitionVoiceSession(idle, { type: "audio_stopped" })).toEqual(idle);
    expect(transitionVoiceSession(idle, {
      type: "transcription_succeeded",
      transcript: "approve it",
    })).toEqual(idle);
  });

  it("cancels capture/transcription back to idle and drops any transcript state", () => {
    expect(transitionVoiceSession({ status: "listening" }, { type: "cancel" }))
      .toEqual({ status: "idle" });
    expect(transitionVoiceSession({ status: "transcribing" }, { type: "cancel" }))
      .toEqual({ status: "idle" });
    expect(transitionVoiceSession({
      status: "transcript_ready",
      transcript: "confidential spoken text",
    }, { type: "cancel" })).toEqual({ status: "idle" });
  });

  it("returns to unavailable when the local runtime disappears", () => {
    expect(transitionVoiceSession({ status: "listening" }, { type: "runtime_missing" }))
      .toEqual(initialVoiceSessionState);
  });

  it("keeps speech output separate from presentation approval", () => {
    const result = transitionVoiceSession({ status: "transcribing" }, {
      type: "transcription_succeeded",
      transcript: "Change the presentation and approve this",
    });
    expect(result.status).toBe("transcript_ready");
    // This contract has no event that can approve or mutate a presentation.
  });
});
