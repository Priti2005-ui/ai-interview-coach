import { cn } from "../../utils/styles.js";

const Card = ({ as: Component = "div", children, className = "", ...props }) => {
  return (
    <Component
      className={cn("rounded-2xl border border-slate-800 bg-slate-900", className)}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
