const Loader = ({ label = "Loading..." }) => {
  return (
    <div className="flex min-h-48 items-center justify-center text-slate-300">
      <div className="flex items-center gap-3">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-indigo-400" />
        <span>{label}</span>
      </div>
    </div>
  );
};

export default Loader;
