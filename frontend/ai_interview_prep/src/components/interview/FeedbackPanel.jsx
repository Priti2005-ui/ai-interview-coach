import Card from "../ui/Card.jsx";

const ListSection = ({ items = [], title }) => (
  <div>
    <p className="mb-2 text-slate-400">{title}</p>

    <ul className="list-inside list-disc space-y-1 text-slate-200">
      {items.map((item, index) => (
        <li key={`${title}-${index}`}>{item}</li>
      ))}
    </ul>
  </div>
);

const TextSection = ({ children, title }) => (
  <div>
    <p className="mb-2 text-slate-400">{title}</p>
    <p className="leading-6 text-slate-200">{children}</p>
  </div>
);

const FeedbackPanel = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <Card as="section" className="rounded-3xl p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-xl font-semibold">AI Feedback</h3>

        <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
          Score: {feedback?.score || 0}
        </span>
      </div>

      <div className="space-y-5">
        <ListSection title="Strengths" items={feedback?.strengths || []} />
        <ListSection title="Weaknesses" items={feedback?.weaknesses || []} />
        <TextSection title="Feedback">{feedback?.feedback}</TextSection>
        <TextSection title="Ideal Answer">{feedback?.idealAnswer}</TextSection>
        <TextSection title="Follow-up Question">
          {feedback?.followUpQuestion}
        </TextSection>
      </div>
    </Card>
  );
};

export default FeedbackPanel;
