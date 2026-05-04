import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "../lib/cn";

type InfoTooltipProps = {
  text: string;
  className?: string;
};

export function InfoTooltip({ text, className }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-flex items-center", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-gray-600 hover:text-purple-400 transition-colors"
        aria-label="More information"
      >
        <Info size={13} />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 rounded-lg border border-gray-700 bg-[#1a1a1a] px-3 py-2.5 text-xs leading-relaxed text-gray-300 shadow-xl">
          {text}
          {/* caret */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
        </div>
      )}
    </div>
  );
}
