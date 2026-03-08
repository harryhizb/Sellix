"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { User, Bot, Loader2, AlertTriangle, Hand } from "lucide-react";

interface TakeoverButtonProps {
  isInTakeover: boolean;
  onTakeoverStart: (reason: string, notes?: string) => Promise<void>;
  onHandback: (summary: string) => Promise<void>;
  isLoading: boolean;
  customerId: string;
  businessId: string;
}

const TAKEOVER_REASONS = [
  { value: "customer_request", label: "Customer Requested Human" },
  { value: "complex_query", label: "Complex Query" },
  { value: "order_issue", label: "Order Issue/Complaint" },
  { value: "technical_support", label: "Technical Support Needed" },
  { value: "high_value_order", label: "High Value Order" },
  { value: "other", label: "Other" }
];

export default function TakeoverButton({
  isInTakeover,
  onTakeoverStart,
  onHandback,
  isLoading,
}: TakeoverButtonProps) {
  const [isTakeoverDialogOpen, setIsTakeoverDialogOpen] = useState(false);
  const [isHandbackDialogOpen, setIsHandbackDialogOpen] = useState(false);
  const [reason, setReason] = useState("complex_query");
  const [notes, setNotes] = useState("");
  const [handbackSummary, setHandbackSummary] = useState("");

  const handleTakeover = async () => {
    await onTakeoverStart(reason, notes);
    setIsTakeoverDialogOpen(false);
    setNotes("");
  };

  const handleHandback = async () => {
    await onHandback(handbackSummary || "Issue resolved");
    setIsHandbackDialogOpen(false);
    setHandbackSummary("");
  };

  return (
    <div className="flex items-center gap-2">
      {isInTakeover ? (
        <>
          <Dialog open={isHandbackDialogOpen} onOpenChange={setIsHandbackDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                <Bot className="w-4 h-4 mr-2" />
                Hand to AI
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Bot className="w-5 h-5 text-[#25D366]" />
                  Hand Back to AI
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Return control to the AI assistant. Add a summary of what was discussed.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handback-summary" className="text-slate-300">Resolution Summary</Label>
                  <Textarea
                    id="handback-summary"
                    placeholder="Briefly describe what was resolved or any important context..."
                    value={handbackSummary}
                    onChange={(e) => setHandbackSummary(e.target.value)}
                    rows={3}
                    className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                  />
                </div>

                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                    <p className="text-sm text-amber-200">
                      The customer will be notified that the AI is resuming.
                      The AI will continue from this context.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsHandbackDialogOpen(false)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleHandback}
                  disabled={isLoading}
                  className="bg-[#25D366] hover:bg-[#1ea855] text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Handing Back...
                    </>
                  ) : (
                    "Confirm Handback"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950"
          >
            <Hand className="w-4 h-4 mr-2" />
            In Control
          </Button>
        </>
      ) : (
        <Dialog open={isTakeoverDialogOpen} onOpenChange={setIsTakeoverDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[#25D366] hover:bg-[#1ea855] text-white">
              <Hand className="w-4 h-4 mr-2" />
              Take Over
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5 text-[#25D366]" />
                Take Over Conversation
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Pause AI and take control of this conversation. The customer will be notified.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="takeover-reason" className="text-slate-300">Reason for Takeover</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800">
                    {TAKEOVER_REASONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-slate-300">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="takeover-notes" className="text-slate-300">Notes (Optional)</Label>
                <Textarea
                  id="takeover-notes"
                  placeholder="Add any context or notes for this takeover..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-600"
                />
              </div>

              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-200">What happens next:</p>
                    <ul className="text-xs text-amber-200/70 list-disc list-inside space-y-1">
                      <li>AI will immediately stop responding</li>
                      <li>Customer will be notified they&apos;re talking to a human</li>
                      <li>All messages will be routed to you</li>
                      <li>Full conversation history will be loaded</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsTakeoverDialogOpen(false)}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleTakeover}
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Taking Over...
                  </>
                ) : (
                  "Confirm Takeover"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
