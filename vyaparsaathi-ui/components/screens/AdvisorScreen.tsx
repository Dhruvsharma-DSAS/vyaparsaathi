"use client";

import "regenerator-runtime/runtime";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { Icon, ProgressBar } from "@/components/ui";
import { speechLanguage } from "@/lib/i18n";
import type { ChatProvider } from "@/lib/types";
import { useApp } from "@/state/AppProvider";

const MAX_INPUT_HEIGHT = 140;
const MODEL_LABEL = { English: "AI model", Hindi: "एआई मॉडल", Marathi: "एआय मॉडेल", Gujarati: "એઆઈ મોડેલ", Bengali: "এআই মডেল" };
const AUTO_LABEL = { English: "Auto", Hindi: "स्वचालित", Marathi: "स्वयंचलित", Gujarati: "સ્વચાલિત", Bengali: "স্বয়ংক্রিয়" };

/** Joins typed text and live voice text without touching the user's own spaces. */
export function composeDraft(draft: string, transcript: string) {
  if (!transcript) return draft;
  if (!draft) return transcript;
  return /\s$/.test(draft) ? draft + transcript : `${draft} ${transcript}`;
}

export function AdvisorScreen() {
  const { copy, language, messages, sendChat, chatStartedAt, chatProvider, setChatProvider, progress, newChat, languageStatus } = useApp();
  const translating = languageStatus.phase === "translating";
  const { t, x } = copy;
  const [draft, setDraft] = useState("");
  const loading = chatStartedAt !== null;
  const [slowTurn, setSlowTurn] = useState<number | null>(null);
  const slow = loading && slowTurn === chatStartedAt;
  const [voiceError, setVoiceError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    transcript, listening, resetTranscript,
    browserSupportsSpeechRecognition, browserSupportsContinuousListening, isMicrophoneAvailable,
  } = useSpeechRecognition();

  const value = composeDraft(draft, transcript);
  const message = value.trim();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // Grow the text box with its content, up to a limit.
  useLayoutEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [value]);

  useEffect(() => {
    if (chatStartedAt === null) return;
    const remaining = Math.max(0, 6000 - (Date.now() - chatStartedAt));
    const timer = window.setTimeout(() => setSlowTurn(chatStartedAt), remaining);
    return () => window.clearTimeout(timer);
  }, [chatStartedAt]);

  // Stop listening when the language changes so the next phrase uses the new locale.
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;
    void SpeechRecognition.stopListening().catch(() => undefined);
  }, [language, browserSupportsSpeechRecognition]);

  const send = async () => {
    if (!message || message.length > 3000 || loading || translating) return;
    if (listening) await SpeechRecognition.stopListening().catch(() => setVoiceError(t.voicePermission));
    resetTranscript();
    setDraft("");
    setVoiceError("");
    sendChat(message);
  };

  /** Re-sends the user message that produced a failed reply. */
  const retry = (failedIndex: number) => {
    const question = messages[failedIndex - 1];
    if (loading || translating || !question || question.role !== "user") return;
    sendChat(question.text, failedIndex);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter adds a line; never send while an IME (Hindi, Bengali…) is composing.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  const toggleVoice = async () => {
    setVoiceError("");
    if (listening) {
      await SpeechRecognition.stopListening().catch(() => setVoiceError(t.voicePermission));
      setDraft(value);
      resetTranscript();
      return;
    }
    if (!browserSupportsSpeechRecognition) return setVoiceError(t.voiceUnsupported);
    if (!isMicrophoneAvailable) return setVoiceError(t.voicePermission);
    setDraft(value);
    resetTranscript();
    try {
      await SpeechRecognition.startListening({ continuous: browserSupportsContinuousListening, language: speechLanguage[language] });
    } catch {
      setVoiceError(t.voicePermission);
    }
  };

  const shownVoiceError = voiceError || (browserSupportsSpeechRecognition && !isMicrophoneAvailable ? t.voicePermission : "");
  const lastFailedIndex = messages.length - 1;

  return (
    <div className="flex min-h-[calc(100vh-11rem)] flex-col">
      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink"><Icon name="support_agent" filled /></span>
        <div className="min-w-0 flex-1">
          <div className="flex justify-between text-xs font-semibold text-muted">
            <span>{t.profile}</span><span>{progress.percent}%</span>
          </div>
          <div className="mt-1.5"><ProgressBar percent={progress.percent} label={t.profile} /></div>
        </div>
        <select
          aria-label={MODEL_LABEL[language]}
          title={MODEL_LABEL[language]}
          value={chatProvider}
          onChange={(event) => setChatProvider(event.target.value as ChatProvider)}
          disabled={loading || translating}
          className="h-10 max-w-[7rem] shrink-0 rounded-xl border border-line bg-surface px-2 text-xs font-semibold text-accent disabled:opacity-50"
        >
          <option value="auto">{AUTO_LABEL[language]}</option>
          <option value="gemini">Gemini</option>
          <option value="groq">Groq</option>
        </select>
        <button
          type="button"
          onClick={() => { newChat(); setDraft(""); resetTranscript(); inputRef.current?.focus(); }}
          disabled={loading || translating || messages.length <= 1}
          aria-label={x.newChat}
          title={x.newChat}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line text-accent transition hover:bg-accent-soft disabled:opacity-40"
        ><Icon name="add_comment" /></button>
      </div>

      <div className="flex-1 space-y-3" aria-live="polite">
        {messages.length <= 1 && (
          // eslint-disable-next-line @next/next/no-img-element -- local SVG illustration
          <img src="/illustrations/saathi-chat.svg" alt="" width={320} height={180} className="rise float mx-auto mb-2 block w-3/4 rounded-2xl" />
        )}
        {messages.map((item, index) => (
          <motion.div
            key={`${item.role}-${index}-${item.time}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={clsx("flex max-w-[85%] flex-col", item.role === "user" ? "ml-auto items-end" : "items-start")}
          >
            <div className={clsx(
              "whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm",
              item.role === "user" && "rounded-br-md bg-accent text-accent-ink",
              item.role === "ai" && !item.failed && "rounded-bl-md border border-line bg-surface text-ink",
              item.failed && "rounded-bl-md border border-bad/30 bg-bad-soft text-bad",
              translating && item.text !== copy.t.greeting && "translating-bubble",
            )} aria-busy={translating || undefined}>
              {item.failed && <Icon name="cloud_off" className="mr-1.5 align-[-3px] text-[18px]" />}
              {item.failed ? (item.rateLimited ? t.rateLimit : t.connection)
                : !item.time && item.role === "ai" ? t.greeting
                  : item.translations?.[language] ?? item.text}
            </div>
            <div className="mt-1 flex items-center gap-3 px-2">
              {item.time && <span className="text-[10px] text-muted">{item.time}</span>}
              {item.failed && index === lastFailedIndex && (
                <button type="button" onClick={() => retry(index)} disabled={loading || translating} className="flex items-center gap-1 text-xs font-semibold text-accent disabled:opacity-50">
                  <Icon name="refresh" className="text-[16px]" />{x.retry}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="flex max-w-[85%] flex-col items-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3 shadow-sm">
                <span className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((dot) => <span key={dot} className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: `${dot * 140}ms` }} />)}
                </span>
                <span className="text-xs text-muted">{x.thinking}</span>
              </div>
              {slow && <p className="mt-1 px-2 text-[11px] text-muted">{x.wakingUp}</p>}
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-24 mt-4 rounded-3xl border border-line bg-surface p-2 shadow-lg transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/10">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            maxLength={3000}
            rows={1}
            className="max-h-[140px] min-h-11 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-ink outline-none placeholder:text-muted"
            placeholder={listening ? t.voiceListening : t.type}
            aria-label={t.type}
            value={value}
            onChange={(event) => { setDraft(event.target.value); resetTranscript(); }}
            onKeyDown={onKeyDown}
            enterKeyHint="send"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => void toggleVoice()}
            disabled={loading}
            aria-label={listening ? t.voiceStop : t.voiceButton}
            aria-pressed={listening}
            className={clsx("grid h-11 w-11 shrink-0 place-items-center rounded-full transition disabled:opacity-50", listening ? "animate-pulse bg-bad text-white" : "bg-surface-2 text-indigo hover:bg-accent-soft")}
          ><Icon name={listening ? "stop" : "mic"} /></button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => void send()}
            disabled={loading || translating || !message || message.length > 3000}
            aria-label="Send message"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-accent-ink shadow-md transition disabled:opacity-40 disabled:shadow-none"
          ><Icon name="arrow_upward" /></motion.button>
        </div>
        {shownVoiceError
          ? <p className="px-3 pb-1 pt-1 text-xs text-bad" role="alert">{shownVoiceError}</p>
          : <p className="px-3 pb-0.5 pt-1 text-[10px] text-muted">{listening ? t.voiceListening : x.sendHint}</p>}
      </div>
    </div>
  );
}
