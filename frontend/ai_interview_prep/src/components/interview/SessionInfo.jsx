import Card from "../ui/Card.jsx";

const SessionInfo = ({ session }) => {
  return (
    <Card as="section" className="rounded-3xl p-6">
      <h3 className="mb-3 text-lg font-semibold">Session Info</h3>

      <div className="space-y-3 text-sm text-slate-300">
        <div className="flex justify-between">
          <span className="text-slate-400">Status</span>
          <span>{session?.status}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Questions</span>
          <span>{session?.questions?.length || 0}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Score</span>
          <span>{Math.round(session?.score || 0)}</span>
        </div>
      </div>
    </Card>
  );
};

export default SessionInfo;
