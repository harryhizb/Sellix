"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  User, Clock, MessageSquare, AlertTriangle, Timer, Activity
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface TakeoverStatusPanelProps {
  takeoverData: any;
  onForceHandback: () => void;
}

export default function TakeoverStatusPanel({
  takeoverData,
  onForceHandback
}: TakeoverStatusPanelProps) {
  const [timeElapsed, setTimeElapsed] = useState("0m");
  const [inactivityTime, setInactivityTime] = useState("0m");
  const [messageLimitProgress, setMessageLimitProgress] = useState(0);

  useEffect(() => {
    if (takeoverData?.startedAt) {
      const updateTimes = () => {
        const now = new Date();
        const startedAt = new Date(takeoverData.startedAt);
        const lastActivity = takeoverData.lastActivity
          ? new Date(takeoverData.lastActivity)
          : startedAt;

        setTimeElapsed(formatDistanceToNow(startedAt, { addSuffix: false }));
        setInactivityTime(formatDistanceToNow(lastActivity, { addSuffix: false }));

        const maxMessages = takeoverData.messageLimit || 50;
        const progress = (takeoverData.messageCount / maxMessages) * 100;
        setMessageLimitProgress(Math.min(progress, 100));
      };

      updateTimes();
      const interval = setInterval(updateTimes, 60000);
      return () => clearInterval(interval);
    }
  }, [takeoverData]);

  const getInactivityWarning = () => {
    if (!takeoverData?.lastActivity) return null;
    const lastActivity = new Date(takeoverData.lastActivity);
    const now = new Date();
    const minutesInactive = Math.floor((now.getTime() - lastActivity.getTime()) / 60000);

    if (minutesInactive > 10) {
      return {
        level: "warning",
        message: `No activity for ${minutesInactive} minutes. Auto-handback in ${15 - minutesInactive} minutes.`
      };
    }
    return null;
  };

  const inactivityWarning = getInactivityWarning();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <User className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Active Takeover</h3>
            <p className="text-xs text-slate-500">You&apos;re in control</p>
          </div>
        </div>
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse">
          Live
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-950 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Clock className="w-3 h-3" />
            <span>Duration</span>
          </div>
          <div className="font-semibold text-white">{timeElapsed}</div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <MessageSquare className="w-3 h-3" />
            <span>Messages</span>
          </div>
          <div className="font-semibold text-white">{takeoverData?.messageCount || 0}</div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Timer className="w-3 h-3" />
            <span>Last Activity</span>
          </div>
          <div className="font-semibold text-white">{inactivityTime}</div>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
            <Activity className="w-3 h-3" />
            <span>Reason</span>
          </div>
          <div className="font-semibold text-white capitalize">
            {takeoverData?.reason?.replace('_', ' ') || 'Manual'}
          </div>
        </div>
      </div>

      {/* Message Limit */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Message Limit</span>
          <span className="text-slate-300">
            {takeoverData?.messageCount || 0} / {takeoverData?.messageLimit || 50}
          </span>
        </div>
        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
          <div 
            className={cn(
              "h-full rounded-full transition-all",
              messageLimitProgress > 80 ? "bg-amber-500" : "bg-[#25D366]"
            )}
            style={{ width: `${messageLimitProgress}%` }}
          />
        </div>
        {messageLimitProgress > 80 && (
          <p className="text-xs text-amber-400">
            Approaching message limit. Consider handing back soon.
          </p>
        )}
      </div>

      {/* Inactivity Warning */}
      {inactivityWarning && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
            <p className="text-sm text-amber-200">{inactivityWarning.message}</p>
          </div>
        </div>
      )}

      {/* Action */}
      <Button
        variant="outline"
        size="sm"
        className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
        onClick={onForceHandback}
      >
        Force Handback to AI
      </Button>

      {/* Tips */}
      <div className="text-xs text-slate-500 pt-3 border-t border-slate-800">
        <p className="font-medium text-slate-400 mb-2">Tips:</p>
        <ul className="space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-[#25D366]">•</span>
            Customer has been notified they&apos;re talking to a human
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#25D366]">•</span>
            AI is paused and won&apos;t respond automatically
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#25D366]">•</span>
            All messages are recorded in the audit log
          </li>
        </ul>
      </div>
    </div>
  );
}
