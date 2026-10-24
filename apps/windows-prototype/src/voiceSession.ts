export type VoiceSessionState =
  | { status: "unavailable"; reason: "local_runtime_missing" }
  | { status: "idle" }
  | { status: "requesting_permission" }
  | { status: "listening" }
  | { status: "transcribing" }
  | { status: "transcript_ready"; transcript: string }
  | { status: "error"; message: string };

export type VoiceSessionEvent =
  | { type: "runtime_ready" }
  | { type: "runtime_missing" }
  | { type: "start_requested" }
  | { type: "permission_granted" }
  | { type: "permission_denied"; message?: string }
  | { type: "audio_stopped" }
  | { type: "transcription_succeeded"; transcript: string }
  | { type: "transcription_failed"; message: string }
  | { type: "dismiss_transcript" }
  | { type: "cancel" };

export const initialVoiceSessionState: VoiceSessionState = {
  status: "unavailable",
  reason: "local_runtime_missing",
};

/**
 * Pure voice-session transition contract.
 *
 * The reducer owns state transitions only. It never captures audio, invokes a
 * process, performs network I/O, or changes a presentation. The unavailable
 * initial state is intentional until a trusted desktop runtime is implemented.
 */
export function transitionVoiceSession(
  state: VoiceSessionState,
  event: VoiceSessionEvent,
): VoiceSessionState {
  if (event.type === "runtime_missing") {
    return { status: "unavailable", reason: "local_runtime_missing" };
  }

  if (event.type === "runtime_ready" && state.status === "unavailable") {
    return { status: "idle" };
  }

  if (event.type === "cancel") {
    return state.status === "unavailable" ? state : { status: "idle" };
  }

  switch (state.status) {
    case "unavailable":
      // A click cannot conjure a local engine into existence.
      return state;

    case "idle":
      return event.type === "start_requested"
        ? { status: "requesting_permission" }
        : state;

    case "requesting_permission":
      if (event.type === "permission_granted") return { status: "listening" };
      if (event.type === "permission_denied") {
        return {
          status: "error",
          message: event.message?.trim() || "Microphone permission was denied.",
        };
      }
      return state;

    case "listening":
      return event.type === "audio_stopped" ? { status: "transcribing" } : state;

    case "transcribing":
      if (event.type === "transcription_failed") {
        return {
          status: "error",
          message: event.message.trim() || "Local transcription failed.",
        };
      }
      if (event.type === "transcription_succeeded") {
        const transcript = event.transcript.trim();
        return transcript
          ? { status: "transcript_ready", transcript }
          : { status: "error", message: "No speech was recognized." };
      }
      return state;

    case "transcript_ready":
      return event.type === "dismiss_transcript" ? { status: "idle" } : state;

    case "error":
      return event.type === "start_requested"
        ? { status: "requesting_permission" }
        : state;
  }
}
