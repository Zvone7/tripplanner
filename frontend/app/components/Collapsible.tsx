import { ChevronDown } from "lucide-react";

export function Collapsible({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="my-3">
      <div className="relative flex items-center">
        <div className="w-full border-t" />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="mx-3 inline-flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground hover:text-foreground rounded-md bg-background"
        >
          <span className="font-medium">{title}</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
        <div className="w-full border-t" />
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}