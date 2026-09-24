import { cn } from "../../utils/styles.js";

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60",
  secondary:
    "border border-slate-700 text-slate-200 hover:border-indigo-500 hover:text-white disabled:opacity-60",
  danger:
    "border border-slate-700 text-slate-200 hover:border-rose-400 hover:text-rose-300 disabled:opacity-60",
  ghost: "text-slate-300 hover:bg-slate-900 hover:text-white disabled:opacity-60",
};

const sizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

const Button = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
