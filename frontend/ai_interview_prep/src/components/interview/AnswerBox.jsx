import { useEffect } from "react";

import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";
import VoiceModePanel from "./VoiceModePanel.jsx";
import useSpeechRecognition from "../../hooks/useSpeechRecognition.js";
import useSpeechSynthesis from "../../hooks/useSpeechSynthesis.js";

const AnswerBox = ({
  answer,
  currentQuestion,
  disabled = false,
  generating,
  onAnswerChange,
  onGenerateNextQuestion,
  onSubmit,
  submitting,
}) => {
  const {
    clearTranscript,
    durationSeconds,
    error: speechError,
    isListening,
    isSupported,
    stopListening,
    transcript,
    toggleListening,
  } = useSpeechRecognition();
  const {
    error: speechSynthesisError,
    isSpeaking,
    isSupported: canReadQuestion,
    stop: stopQuestionAudio,
    toggle: toggleQuestionAudio,
  } = useSpeechSynthesis();

  const formattedVoiceTime = `${String(Math.floor(durationSeconds / 60)).padStart(
    2,
    "0"
  )}:${String(durationSeconds % 60).padStart(2, "0")}`;

  const handleUseVoiceDraft = () => {
    if (!transcript) return;

    onAnswerChange(`${answer ? `${answer.trim()} ` : ""}${transcript}`.trim());
    clearTranscript();
  };

  const handleSubmit = (event) => {
    stopListening();
    stopQuestionAudio();
    onSubmit(event);
  };

  const handleGenerateNextQuestion = () => {
    stopListening();
    stopQuestionAudio();
    clearTranscript();
    onGenerateNextQuestion();
  };

  useEffect(() => {
    stopListening();
    stopQuestionAudio();
    clearTranscript();
  }, [clearTranscript, currentQuestion?._id, stopListening, stopQuestionAudio]);

  return (
    <Card as="section" className="rounded-3xl p-6 md:p-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row">
        <div>
          <p className="text-sm text-slate-400">Current Question</p>

          <h2 className="mt-1 text-xl font-semibold md:text-2xl">
            {currentQuestion?.question}
          </h2>

          {speechSynthesisError ? (
            <p className="mt-2 text-sm text-rose-300">{speechSynthesisError}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-start gap-3 text-sm text-slate-400 md:items-end">
          <div className="md:text-right">
            <p>{currentQuestion?.type}</p>
            <p>{currentQuestion?.difficulty}</p>
          </div>

          <Button
            type="button"
            onClick={() => toggleQuestionAudio(currentQuestion?.question)}
            disabled={!canReadQuestion || !currentQuestion?.question}
            variant={isSpeaking ? "danger" : "secondary"}
            size="sm"
          >
            {isSpeaking ? "Stop Reading" : "Read Question"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <textarea
            rows={10}
            value={answer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="Write your answer here or use voice input..."
            className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <VoiceModePanel
          duration={formattedVoiceTime}
          error={speechError}
          isListening={isListening}
          isSupported={isSupported}
          onClearDraft={clearTranscript}
          onToggleListening={toggleListening}
          onUseDraft={handleUseVoiceDraft}
          transcript={transcript}
          disabled={disabled || submitting}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            disabled={submitting || disabled}
            size="lg"
            className="font-semibold"
          >
            {submitting ? "Evaluating..." : "Submit Answer"}
          </Button>

          <Button
            type="button"
            onClick={handleGenerateNextQuestion}
            disabled={generating || disabled}
            variant="secondary"
            size="lg"
            className="font-semibold"
          >
            {generating ? "Generating..." : "Next Adaptive Question"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AnswerBox;
