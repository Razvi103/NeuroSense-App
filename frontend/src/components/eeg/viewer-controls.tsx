"use client";

import { cn } from "@/lib/utils";
import { TIME_WINDOWS, GAIN_PRESETS } from "@/lib/constants";

interface ViewerControlsProps {
  timeWindow: number;
  onTimeWindowChange: (tw: number) => void;
  gain: number;
  onGainChange: (g: number) => void;
  availableChannels: string[];
  visibleChannels: Set<string>;
  onToggleChannel: (label: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

export function ViewerControls({
  timeWindow,
  onTimeWindowChange,
  gain,
  onGainChange,
  availableChannels,
  visibleChannels,
  onToggleChannel,
  onShowAll,
  onHideAll,
}: ViewerControlsProps) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <h4 className="mb-2 font-semibold text-text-primary font-heading text-xs uppercase tracking-wider">
          Time Window
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {TIME_WINDOWS.map((tw) => (
            <button
              key={tw}
              onClick={() => onTimeWindowChange(tw)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer font-heading border",
                timeWindow === tw
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary hover:text-text-primary border-border hover:border-text-muted",
              )}
            >
              {tw}s
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 font-semibold text-text-primary font-heading text-xs uppercase tracking-wider">
          Amplitude Gain
        </h4>
        <div className="flex flex-wrap gap-1.5">
          {GAIN_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => onGainChange(preset.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer font-heading border",
                Math.abs(gain - preset.value) < 0.01
                  ? "bg-text-primary text-surface border-text-primary"
                  : "bg-surface text-text-secondary hover:text-text-primary border-border hover:border-text-muted",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-text-primary font-heading text-xs uppercase tracking-wider">
            Channels
          </h4>
          <div className="flex gap-2">
            <button onClick={onShowAll} className="text-xs text-blue-600 hover:underline hover:text-blue-800 cursor-pointer">
              all
            </button>
            <button onClick={onHideAll} className="text-xs text-text-muted hover:underline hover:text-text-secondary cursor-pointer">
              none
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {availableChannels.map((label) => (
            <button
              key={label}
              onClick={() => onToggleChannel(label)}
              className={cn(
                "rounded px-1 py-1 text-[10px] font-mono transition-colors cursor-pointer border overflow-hidden text-ellipsis whitespace-nowrap",
                visibleChannels.has(label)
                  ? "bg-elevated text-text-primary border-border"
                  : "text-text-muted/40 border-transparent hover:border-border",
              )}
              title={label}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h4 className="mb-2 font-semibold text-text-primary font-heading text-xs uppercase tracking-wider">
          Keyboard
        </h4>
        <div className="space-y-1 text-xs text-text-muted">
          <p><span className="font-mono text-text-secondary">Left/Right</span> scroll</p>
          <p><span className="font-mono text-text-secondary">Up/Down</span> gain</p>
          <p><span className="font-mono text-text-secondary">Scroll</span> navigate</p>
        </div>
      </div>
    </div>
  );
}
