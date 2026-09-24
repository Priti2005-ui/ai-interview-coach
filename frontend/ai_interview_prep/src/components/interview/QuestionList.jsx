import Card from "../ui/Card.jsx";
import { cn } from "../../utils/styles.js";

const QuestionList = ({ currentQuestionId, questions = [], onSelectQuestion }) => {
  return (
    <Card as="section" className="rounded-3xl p-6">
      <h3 className="mb-4 text-lg font-semibold">Session Questions</h3>

      <div className="max-h-[500px] space-y-3 overflow-auto">
        {questions.map((question, index) => (
          <button
            key={question._id}
            type="button"
            onClick={() => onSelectQuestion(question, index)}
            className={cn(
              "w-full rounded-2xl border px-4 py-3 text-left transition-all",
              currentQuestionId === question._id
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
            )}
          >
            <p className="mb-1 text-sm text-slate-400">Question {index + 1}</p>
            <p className="line-clamp-2 text-sm font-medium text-slate-200">
              {question.question}
            </p>
          </button>
        ))}
      </div>
    </Card>
  );
};

export default QuestionList;
