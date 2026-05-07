"use client";

import { useState, useMemo, useCallback } from "react";
import type { EEGData, SeizureEvent, Recording, Patient } from "@/lib/types";
import { useEegNavigation } from "@/hooks/use-eeg-navigation";
import { ChannelCanvas } from "./channel-canvas";
import { TimelineBar } from "./timeline-bar";
import { ViewerControls } from "./viewer-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface EegViewerProps {
  eegData: EEGData;
  seizureEvents: SeizureEvent[];
  recording: Recording;
  patient: Patient;
}

type TabId = "predictions" | "ground_truth" | "comparison";

export function EegViewer({
  eegData,
  seizureEvents,
  recording,
  patient,
}: EegViewerProps) {
  const [visibleChannels, setVisibleChannels] = useState<Set<string>>(
    () => new Set(eegData.channels.map((c) => c.label)),
  );
  const [controlsOpen, setControlsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("predictions");

  const nav = useEegNavigation({ durationSeconds: eegData.durationSeconds });

  const modelEvents = useMemo(
    () => seizureEvents.filter((e) => e.type === "model"),
    [seizureEvents],
  );
  const gtEvents = useMemo(
    () => seizureEvents.filter((e) => e.type === "ground_truth"),
    [seizureEvents],
  );

  const toggleChannel = useCallback((label: string) => {
    setVisibleChannels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const showAll = useCallback(() => {
    setVisibleChannels(new Set(eegData.channels.map((c) => c.label)));
  }, [eegData.channels]);

  const hideAll = useCallback(() => {
    setVisibleChannels(new Set());
  }, []);

  const tabs: { id: TabId; label: string }[] = [
    { id: "predictions", label: "Model Predictions" },
    { id: "ground_truth", label: "Ground Truth" },
    { id: "comparison", label: "Comparison" },
  ];

  const displayedEvents = activeTab === "ground_truth" ? [] : modelEvents;
  const displayedGt = activeTab === "predictions" ? [] : gtEvents;

  return (
    <div className="flex h-full gap-0">
      <div className="flex flex-1 flex-col min-w-0">
        {/* recording header */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-base font-semibold text-text-primary font-heading">
                {patient.firstName} {patient.lastName}
              </h2>
              <p className="text-xs text-text-muted font-mono">
                {recording.fileName} &middot; {formatDuration(recording.durationSeconds)} &middot; {recording.channelCount}ch @ {recording.sampleRate}Hz
              </p>
            </div>
            {recording.seizureCount > 0 && (
              <Badge variant="warning">{recording.seizureCount} seizures detected</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-muted font-mono">
              {formatTime(nav.timeOffset)} - {formatTime(nav.timeOffset + nav.timeWindow)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setControlsOpen(!controlsOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Controls
            </Button>
          </div>
        </div>

        {/* eeg canvas area */}
        <div className="flex-1 min-h-[400px]">
          <ChannelCanvas
            channels={eegData.channels}
            visibleChannels={visibleChannels}
            timeOffset={nav.timeOffset}
            timeWindow={nav.timeWindow}
            gain={nav.gain}
            seizureEvents={displayedEvents}
            groundTruthEvents={displayedGt}
            onTimeClick={(t) => nav.jumpTo(t)}
          />
        </div>

        {/* timeline */}
        <div className="border-t border-border bg-surface px-5 py-3">
          <TimelineBar
            durationSeconds={eegData.durationSeconds}
            timeOffset={nav.timeOffset}
            timeWindow={nav.timeWindow}
            seizureEvents={modelEvents}
            groundTruthEvents={gtEvents}
            onSeek={nav.jumpTo}
          />
        </div>

        {/* bottom panel with tabs */}
        <div className="border-t border-border bg-surface">
          <div className="flex border-b border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-4 py-2.5 text-xs font-medium font-heading transition-colors cursor-pointer",
                  activeTab === tab.id
                    ? "text-text-primary border-b-2 border-text-primary"
                    : "text-text-muted hover:text-text-secondary",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="max-h-48 overflow-y-auto px-5 py-3">
            <EventsTable
              events={activeTab === "ground_truth" ? gtEvents : modelEvents}
              showAttention={activeTab !== "ground_truth"}
              onJump={nav.jumpTo}
              gtEvents={activeTab === "comparison" ? gtEvents : []}
            />
          </div>
        </div>
      </div>

      {/* controls sidebar */}
      {controlsOpen && (
        <div className="w-56 shrink-0 border-l border-border bg-surface p-4 overflow-y-auto">
          <ViewerControls
            timeWindow={nav.timeWindow}
            onTimeWindowChange={nav.setTimeWindow}
            gain={nav.gain}
            onGainChange={nav.setGain}
            availableChannels={eegData.channels.map((c) => c.label)}
            visibleChannels={visibleChannels}
            onToggleChannel={toggleChannel}
            onShowAll={showAll}
            onHideAll={hideAll}
          />
        </div>
      )}
    </div>
  );
}

function EventsTable({
  events,
  showAttention,
  onJump,
  gtEvents,
}: {
  events: SeizureEvent[];
  showAttention: boolean;
  onJump: (t: number) => void;
  gtEvents: SeizureEvent[];
}) {
  if (events.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-muted">
        No events to display.
      </p>
    );
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-left text-text-muted">
          <th className="pb-2 font-heading font-medium">Start</th>
          <th className="pb-2 font-heading font-medium">End</th>
          <th className="pb-2 font-heading font-medium">Duration</th>
          <th className="pb-2 font-heading font-medium">Channels</th>
          {showAttention && <th className="pb-2 font-heading font-medium">Attention Weights</th>}
          {gtEvents.length > 0 && <th className="pb-2 font-heading font-medium">GT Match</th>}
          <th className="pb-2" />
        </tr>
      </thead>
      <tbody>
        {events.map((event) => {
          const duration = event.endTime - event.startTime;
          const matchedGt = gtEvents.find(
            (gt) =>
              Math.abs(gt.startTime - event.startTime) < 5 &&
              Math.abs(gt.endTime - event.endTime) < 5,
          );

          // Get top 3 channels by attention
          const topAttention = event.channelAttention 
            ? Object.entries(event.channelAttention)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
            : [];

          return (
            <tr key={event.id} className="border-t border-border/30">
              <td className="py-2 font-mono text-text-secondary">{formatTime(event.startTime)}</td>
              <td className="py-2 font-mono text-text-secondary">{formatTime(event.endTime)}</td>
              <td className="py-2 text-text-secondary">{duration.toFixed(1)}s</td>
              <td className="py-2 text-text-secondary">{event.channels.join(", ")}</td>
              {showAttention && (
                <td className="py-2">
                  {topAttention.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {topAttention.map(([ch, weight]) => (
                        <span key={ch} className="inline-flex items-center rounded-sm bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-text-secondary border border-border">
                          {ch}: {(weight * 100).toFixed(1)}%
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-text-muted">N/A</span>
                  )}
                </td>
              )}
              {gtEvents.length > 0 && (
                <td className="py-2">
                  {matchedGt ? (
                    <span className="text-emerald-accent">yes</span>
                  ) : (
                    <span className="text-rose-accent">no</span>
                  )}
                </td>
              )}
              <td className="py-2 text-right">
                <button
                  onClick={() => onJump(event.startTime)}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  jump
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
