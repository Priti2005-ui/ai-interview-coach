import { Link } from "react-router-dom";

import Button from "../ui/Button.jsx";
import Card from "../ui/Card.jsx";

const SessionHeader = ({
  session,
  formattedTime,
  currentQuestionIndex,
  detailTo,
  ending = false,
  onEndSession,
  totalQuestions,
}) => {
  const isCompleted = session?.status === "completed";

  return (
    <Card as="section" className="rounded-3xl p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-indigo-400">Adaptive Interview Session</p>

          <h1 className="mt-1 text-2xl font-bold md:text-3xl">
            {session?.jobRole}
          </h1>

          <p className="mt-2 text-slate-400">
            {session?.experienceLevel} • {session?.difficulty}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-28 rounded-2xl border border-slate-700 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">Timer</p>
            <p className="text-lg font-semibold">{formattedTime}</p>
          </div>

          <div className="min-w-28 rounded-2xl border border-slate-700 px-4 py-3 text-center">
            <p className="text-xs text-slate-400">Progress</p>
            <p className="text-lg font-semibold">
              {currentQuestionIndex + 1}/{totalQuestions}
            </p>
          </div>

          {detailTo ? (
            <Link
              to={detailTo}
              className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-200 transition-all hover:border-indigo-500 hover:text-white"
            >
              Details
            </Link>
          ) : null}

          {onEndSession ? (
            <Button
              type="button"
              onClick={onEndSession}
              disabled={ending || isCompleted}
              variant={isCompleted ? "secondary" : "danger"}
              className="px-4 py-3"
            >
              {isCompleted ? "Session Ended" : ending ? "Ending..." : "End Session"}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );
};

export default SessionHeader;
