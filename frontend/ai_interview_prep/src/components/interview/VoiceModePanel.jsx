import Button from "../ui/Button.jsx";

const VoiceModePanel = ({
  duration,
  disabled = false,
  error,
  isListening,
  isSupported,
  onClearDraft,
  onToggleListening,
  onUseDraft,
  transcript,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">Voice Mode</p>
          <p className="mt-1 text-sm text-slate-400">
            {isSupported
              ? isListening
                ? `Listening... ${duration}`
                : "Record a draft, review it, then add it to your answer."
              : "Voice input is not supported in this browser. Try Chrome or Edge."}
          </p>
        </div>

        <Button
          type="button"
          onClick={onToggleListening}
          disabled={!isSupported || disabled}
          variant={isListening ? "danger" : "secondary"}
          size="sm"
          className="font-semibold"
        >
          {isListening ? "Stop Voice" : "Start Voice"}
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {transcript ? (
        <div className="mt-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-medium text-indigo-200">Voice Draft</p>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={onUseDraft}
                size="sm"
                className="font-semibold"
              >
                Use Draft
              </Button>

              <Button
                type="button"
                onClick={onClearDraft}
                size="sm"
                variant="secondary"
              >
                Clear Draft
              </Button>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-200">{transcript}</p>
        </div>
      ) : null}
    </div>
  );
};

export default VoiceModePanel;
