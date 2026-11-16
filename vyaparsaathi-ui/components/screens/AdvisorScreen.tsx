"use client";

import "regenerator-runtime/runtime";
import { clsx } from "clsx";
import { useEffect, useRef, useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Icon, ProgressBar } from "@/components/ui";
import { api, isRateLimited } from "@/lib/api";
import { nowTime } from "@/lib/format";
import { speechLanguage } from "@/lib/i18n";
import { useApp } from "@/state/AppProvider";

export function AdvisorScreen() {
  const { copy, language, messages, setMessages, vyaparState, setVyaparState, progress } = useApp();
  const { t } = copy;
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const {
    transcript, listening, resetTranscript,
    browserSupportsSpeechRecognition, browserSupportsContinuousListening, isMicrophoneAvailable,
  } = useSpeechRecognition();

  const combined = [draft.trim(), transcript.trim()].filter(Boolean).join(" ");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Stop listening when the language changes so the next phrase uses the new locale.
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    void SpeechRecognition.stopListening().catch(() => undefined);
  }, [language, browserSupportsSpeechRecognition]);

  const send = async () => {
    if (!combined || loading) return;
    if (listening) await SpeechRecognition.stopListening().catch(() => setVoiceError(t.voicePermission));
    resetTranscript();
    const time = nowTime();
    const history = messages;
    const withUser = [...history, { role: "user" as const, text: combined, time }];
    setMessages(withUser);
    setDraft("");
    setVoiceError("");
    setLoading(true);
    try {
      const response = await api.chat(vyaparState, combined, history);
      setVyaparState(response.updated_state);
      setMessages([...withUser, { role: "ai", text: response.response_text, time: nowTime() }]);
    } catch (error) {
      setMessages([...withUser, { role: "ai", text: isRateLimited(error) ? t.rateLimit : t.connection, time }]);
    } finally {
      setLoading(false);
    }
  };

  const toggleVoice = async () => {
    setVoiceError("");
    if (listening) {
      await SpeechRecognition.stopListening().catch(() => setVoiceError(t.voicePermission));
      return;
    }
    if (!browserSupportsSpeechRecognition) return setVoiceError(t.voiceUnsupported);
    if (!isMicrophoneAvailable) return setVoiceError(t.voicePermission);
    setDraft(combined);
    resetTranscript();
    try {
      await SpeechRecognition.startListening({ continuous: browserSupportsContinuousListening, language: speechLanguage[language] });
    } catch {
      setVoiceError(t.voicePermission);
    }
  };

  const shownVoiceError = voiceError || (browserSupportsSpeechRecognition && !isMicrophoneAvailable ? t.voicePermission : "");

  return (
    <div className="flex min-h-[calc(100vh-11rem)] flex-col">
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"><Icon name="support_agent" filled /></span>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between text-xs font-semibold text-muted">
            <span>{t.profile}</span><span>{progress.percent}%</span>
          </div>
          <div className="mt-1.5"><ProgressBar percent={progress.percent} label={t.profile} /></div>
        </div>
      </div>

      <div className="flex-1 space-y-3" aria-live="polite">
        {messages.length <= 1 && (
          // eslint-disable-next-line @next/next/no-img-element -- local SVG illustration
          <img src="/illustrations/saathi-chat.svg" alt="" width={320} height={180} className="rise float mx-auto mb-2 block w-3/4 rounded-2xl" />
        )}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={clsx("rise flex max-w-[85%] flex-col", message.role === "user" ? "ml-auto items-end" : "items-start")}>
            <div className={clsx(
              "rounded-3xl px-4 py-3 text-[15px] leading-relaxed",
              message.role === "user" ? "rounded-br-md bg-ink text-bg" : "rounded-bl-md border border-line bg-surface",
            )}>{message.text}</div>
            {message.time && <span className="mt-1 px-2 text-[10px] text-muted">{message.time}</span>}
          </div>
        ))}
        {loading && (
          <div className="flex gap-1.5 rounded-3xl border border-line bg-surface px-4 py-4" role="status" aria-label="Waiting for response" style={{ width: "fit-content" }}>
            {[0, 1, 2].map((dot) => <span key={dot} className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${dot * 120}ms` }} />)}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-24 mt-4 rounded-3xl border border-line bg-surface p-2 shadow-lg">
        <div className="flex items-center gap-2">
          <input
            className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] outline-none"
            placeholder={listening ? t.voiceListening : t.type}
            aria-label={t.type}
            value={combined}
            onChange={(event) => { setDraft(event.target.value); resetTranscript(); }}
            onKeyDown={(event) => { if (event.key === "Enter") void send(); }}
          />
          <button
            type="button"
            onClick={() => void toggleVoice()}
            disabled={loading}
            aria-label={listening ? t.voiceStop : t.voiceButton}
            aria-pressed={listening}
            className={clsx("grid h-11 w-11 place-items-center rounded-full transition disabled:opacity-50", listening ? "animate-pulse bg-bad text-white" : "bg-surface-2 text-indigo")}
          ><Icon name={listening ? "stop" : "mic"} /></button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !combined}
            aria-label="Send message"
            className="grid h-11 w-11 place-items-center rounded-full bg-accent text-accent-ink disabled:opacity-40"
          ><Icon name="arrow_upward" /></button>
        </div>
        {shownVoiceError && <p className="px-3 pb-1 text-xs text-bad" role="alert">{shownVoiceError}</p>}
      </div>
    </div>
  );
}
