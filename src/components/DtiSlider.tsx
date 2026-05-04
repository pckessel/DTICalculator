import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../lib/cn";

export const DTI_MIN = 10;
// 45% = Fannie Mae / Freddie Mac manual-underwriting ceiling for conventional conforming loans
export const DTI_MAX = 45;

// Zone boundaries (NerdWallet, Bankrate, Chase, CFPB consensus):
//   ≤36% — Safe (the 28/36 rule; NerdWallet/Bankrate/Chase all say under 36% is "good")
//   36–43% — Caution (lenders still approve here, but multiple sources flag it as elevated)
//   >43% — Aggressive (Bankrate: "a lot of debt"; requires compensating factors)
const GREEN_END = 36;
const ORANGE_END = 43;

function dtiToTrackPct(val: number): number {
  return ((val - DTI_MIN) / (DTI_MAX - DTI_MIN)) * 100;
}

const GREEN_STOP = dtiToTrackPct(GREEN_END); // ~74.3%
const ORANGE_STOP = dtiToTrackPct(ORANGE_END); // ~94.3%

type Zone = "safe" | "caution" | "aggressive";

export function getDtiZone(value: number): Zone {
  if (value <= GREEN_END) return "safe";
  if (value <= ORANGE_END) return "caution";
  return "aggressive";
}

const ZONE_META: Record<Zone, { label: string; textCls: string; borderCls: string; glow: string }> =
  {
    safe: {
      label: "Safe",
      textCls: "text-green-400",
      borderCls: "border-green-400",
      glow: "#4ade8040",
    },
    caution: {
      label: "Caution",
      textCls: "text-amber-400",
      borderCls: "border-amber-400",
      glow: "#fbbf2440",
    },
    aggressive: {
      label: "Aggressive",
      textCls: "text-red-400",
      borderCls: "border-red-400",
      glow: "#f8717140",
    },
  };

type DtiSliderProps = {
  value: number;
  onChange: (val: number) => void;
  instanceId: string;
};

export function DtiSlider({ value, onChange, instanceId }: DtiSliderProps) {
  const safe = Math.max(DTI_MIN, Math.min(DTI_MAX, value));
  const zone = getDtiZone(safe);
  const meta = ZONE_META[zone];

  const trackGradient = [
    `#22c55e 0%`,
    `#22c55e ${GREEN_STOP}%`,
    `#f59e0b ${GREEN_STOP}%`,
    `#f59e0b ${ORANGE_STOP}%`,
    `#ef4444 ${ORANGE_STOP}%`,
    `#ef4444 100%`,
  ].join(", ");

  return (
    <div className="space-y-3" id={`dti-slider-${instanceId}`}>
      {/* Live value display */}
      <div className="flex items-baseline gap-2">
        <span
          className={cn("font-mono text-3xl font-black tabular-nums leading-none", meta.textCls)}
        >
          {safe}%
        </span>
        <span className={cn("text-sm font-medium", meta.textCls)}>{meta.label}</span>
      </div>

      {/* Gradient single-thumb slider */}
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        min={DTI_MIN}
        max={DTI_MAX}
        step={1}
        value={[safe]}
        onValueChange={([val]) => onChange(val)}
        aria-labelledby={`dti-slider-${instanceId}`}
      >
        <SliderPrimitive.Track
          className="relative h-2.5 w-full grow overflow-hidden rounded-full"
          style={{ background: `linear-gradient(to right, ${trackGradient})` }}
        >
          <SliderPrimitive.Range className="absolute h-full bg-black/20" />
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb
          className={cn(
            "block h-5 w-5 rounded-full border-2 bg-gray-900 shadow-lg transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950",
            "disabled:pointer-events-none disabled:opacity-50",
            meta.borderCls,
          )}
          style={{ boxShadow: `0 0 0 4px ${meta.glow}` }}
          aria-label="DTI target"
        />
      </SliderPrimitive.Root>

      {/* Tick labels */}
      <div className="relative h-4 select-none text-xs">
        <span className="absolute left-0 text-gray-600">{DTI_MIN}%</span>
        <span
          className="absolute -translate-x-1/2 text-green-600/60"
          style={{ left: `${GREEN_STOP}%` }}
        >
          36
        </span>
        <span
          className="absolute -translate-x-1/2 text-amber-600/60"
          style={{ left: `${ORANGE_STOP}%` }}
        >
          43
        </span>
        <span className="absolute right-0 text-gray-600">{DTI_MAX}%</span>
      </div>

      {/* Zone legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1 text-green-500/80">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          ≤36% Safe
        </span>
        <span className="flex items-center gap-1 text-amber-500/80">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          36–43% Caution
        </span>
        <span className="flex items-center gap-1 text-red-500/80">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          &gt;43% Aggressive
        </span>
        <span className="ml-auto text-gray-600">45% = conventional ceiling</span>
      </div>
    </div>
  );
}
