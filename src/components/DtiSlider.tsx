import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../lib/cn";

export const DTI_SLIDER_MIN = 10;
export const DTI_SLIDER_MAX = 50;

// Zone boundaries (research-backed):
//   ≤36% — Safe (classic 28/36 rule; FIRE community target)
//   36–43% — Moderate (standard lender comfort zone)
//   >43% — Aggressive (near Fannie Mae's automated 45% ceiling; 50% practical max)
const GREEN_END = 36;
const ORANGE_END = 43;

function dtiToTrackPct(val: number): number {
  return ((val - DTI_SLIDER_MIN) / (DTI_SLIDER_MAX - DTI_SLIDER_MIN)) * 100;
}

const GREEN_STOP = dtiToTrackPct(GREEN_END); // 65%
const ORANGE_STOP = dtiToTrackPct(ORANGE_END); // 82.5%

type Zone = "safe" | "moderate" | "aggressive";

export function getDtiZone(value: number): Zone {
  if (value <= GREEN_END) return "safe";
  if (value <= ORANGE_END) return "moderate";
  return "aggressive";
}

const ZONE_META: Record<Zone, { label: string; textCls: string; borderCls: string; hex: string }> =
  {
    safe: {
      label: "Safe",
      textCls: "text-green-400",
      borderCls: "border-green-400",
      hex: "#4ade80",
    },
    moderate: {
      label: "Moderate",
      textCls: "text-amber-400",
      borderCls: "border-amber-400",
      hex: "#fbbf24",
    },
    aggressive: {
      label: "Aggressive",
      textCls: "text-red-400",
      borderCls: "border-red-400",
      hex: "#f87171",
    },
  };

type DtiSliderProps = {
  target: number;
  hardMax: number;
  onTargetChange: (val: number) => void;
  onHardMaxChange: (val: number) => void;
  instanceId: string;
};

export function DtiSlider({
  target,
  hardMax,
  onTargetChange,
  onHardMaxChange,
  instanceId,
}: DtiSliderProps) {
  const safeTarget = Math.max(DTI_SLIDER_MIN, Math.min(DTI_SLIDER_MAX, target));
  const safeHardMax = Math.max(DTI_SLIDER_MIN, Math.min(DTI_SLIDER_MAX, hardMax));

  const targetZone = getDtiZone(safeTarget);
  const hardMaxZone = getDtiZone(safeHardMax);
  const targetMeta = ZONE_META[targetZone];
  const hardMaxMeta = ZONE_META[hardMaxZone];

  function handleSliderChange([newTarget, newHardMax]: number[]) {
    if (newTarget !== safeTarget) onTargetChange(newTarget);
    if (newHardMax !== safeHardMax) onHardMaxChange(newHardMax);
  }

  function handleTargetInput(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) {
      const clamped = Math.max(DTI_SLIDER_MIN, Math.min(n, safeHardMax - 1));
      onTargetChange(clamped);
    }
  }

  function handleHardMaxInput(raw: string) {
    const n = parseInt(raw, 10);
    if (!isNaN(n)) {
      const clamped = Math.max(safeTarget + 1, Math.min(n, DTI_SLIDER_MAX));
      onHardMaxChange(clamped);
    }
  }

  const trackGradient = [
    `#22c55e 0%`,
    `#22c55e ${GREEN_STOP}%`,
    `#f59e0b ${GREEN_STOP}%`,
    `#f59e0b ${ORANGE_STOP}%`,
    `#ef4444 ${ORANGE_STOP}%`,
    `#ef4444 100%`,
  ].join(", ");

  return (
    <div className="space-y-3">
      {/* Value labels */}
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <p className="text-xs text-gray-500">Your DTI Target</p>
          <p className={cn("font-mono text-lg font-bold leading-none", targetMeta.textCls)}>
            {safeTarget}%
            <span className="ml-2 text-xs font-normal opacity-80">{targetMeta.label}</span>
          </p>
        </div>
        <div className="space-y-0.5 text-right">
          <p className="text-xs text-gray-500">Lender Hard Max</p>
          <p className={cn("font-mono text-base font-semibold leading-none", hardMaxMeta.textCls)}>
            {safeHardMax}%
            <span className="ml-1 text-xs font-normal opacity-80">{hardMaxMeta.label}</span>
          </p>
        </div>
      </div>

      {/* Dual-thumb gradient slider */}
      <SliderPrimitive.Root
        className="relative flex w-full touch-none select-none items-center"
        min={DTI_SLIDER_MIN}
        max={DTI_SLIDER_MAX}
        step={1}
        value={[safeTarget, safeHardMax]}
        onValueChange={handleSliderChange}
        minStepsBetweenThumbs={1}
      >
        <SliderPrimitive.Track
          className="relative h-2 w-full grow overflow-hidden rounded-full"
          style={{ background: `linear-gradient(to right, ${trackGradient})` }}
        >
          {/* Translucent overlay between the two thumbs (buffer zone) */}
          <SliderPrimitive.Range className="absolute h-full bg-white/10" />
        </SliderPrimitive.Track>

        {/* Target thumb — larger, solid fill */}
        <SliderPrimitive.Thumb
          className={cn(
            "block h-5 w-5 rounded-full border-2 bg-gray-900 shadow-lg transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950",
            "disabled:pointer-events-none disabled:opacity-50",
            targetMeta.borderCls,
          )}
          style={{ boxShadow: `0 0 0 3px ${targetMeta.hex}30` }}
          aria-label="DTI target"
        />

        {/* Hard-max thumb — slightly smaller, outline only */}
        <SliderPrimitive.Thumb
          className={cn(
            "block h-4 w-4 rounded-full border-2 bg-gray-900 shadow transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950",
            "disabled:pointer-events-none disabled:opacity-50",
            hardMaxMeta.borderCls,
          )}
          aria-label="Hard max DTI"
        />
      </SliderPrimitive.Root>

      {/* Track tick labels */}
      <div className="relative h-4 text-xs text-gray-600">
        <span className="absolute left-0">{DTI_SLIDER_MIN}%</span>
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
        <span className="absolute right-0">{DTI_SLIDER_MAX}%</span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1 text-green-500/80">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          ≤36% Safe
        </span>
        <span className="flex items-center gap-1 text-amber-500/80">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          36–43% Moderate
        </span>
        <span className="flex items-center gap-1 text-red-500/80">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          &gt;43% Aggressive
        </span>
      </div>

      {/* Override inputs */}
      <div className="flex gap-4 pt-1">
        <div className="flex items-center gap-2">
          <label
            htmlFor={`dti-target-${instanceId}`}
            className="text-xs text-gray-500 whitespace-nowrap"
          >
            Target
          </label>
          <div className="flex items-center gap-1">
            <input
              id={`dti-target-${instanceId}`}
              type="number"
              min={DTI_SLIDER_MIN}
              max={safeHardMax - 1}
              step={1}
              value={safeTarget}
              onChange={(e) => handleTargetInput(e.target.value)}
              className={cn(
                "w-14 rounded-md border bg-gray-900 px-2 py-1 text-right font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                targetMeta.borderCls,
                targetMeta.textCls,
              )}
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor={`dti-hardmax-${instanceId}`}
            className="text-xs text-gray-500 whitespace-nowrap"
          >
            Hard Max
          </label>
          <div className="flex items-center gap-1">
            <input
              id={`dti-hardmax-${instanceId}`}
              type="number"
              min={safeTarget + 1}
              max={DTI_SLIDER_MAX}
              step={1}
              value={safeHardMax}
              onChange={(e) => handleHardMaxInput(e.target.value)}
              className={cn(
                "w-14 rounded-md border bg-gray-900 px-2 py-1 text-right font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                hardMaxMeta.borderCls,
                hardMaxMeta.textCls,
              )}
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-600">
        Most lenders approve up to 45%. 40% target gives a comfortable buffer. The FIRE community
        targets ≤36%.
      </p>
    </div>
  );
}
