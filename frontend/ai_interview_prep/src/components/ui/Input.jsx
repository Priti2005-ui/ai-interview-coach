import { cn } from "../../utils/styles.js";

const Input = ({ label, className = "", inputClassName = "", ...props }) => {
  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm text-slate-300" htmlFor={props.id}>
          {label}
        </label>
      )}

      <input
        className={cn(
          "w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-indigo-500",
          inputClassName
        )}
        {...props}
      />
    </div>
  );
};

export default Input;
