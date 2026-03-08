"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Send, Clock, Zap, MessageSquareQuote, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

const QUICK_REPLIES = [
  "I'll check that for you right away.",
  "Thanks for your patience. Let me look into this.",
  "Can you share more details about the issue?",
  "I've noted your concern and will follow up.",
  "Your order is being processed. I'll update you shortly.",
  "Is there anything else I can help with?",
];

const MESSAGE_TEMPLATES = [
  {
    category: "Greetings",
    templates: [
      "Hello! How can I assist you today?",
      "Welcome! I'm here to help.",
      "Hi there! What can I do for you?"
    ]
  },
  {
    category: "Order Updates",
    templates: [
      "Your order has been confirmed and is being processed.",
      "I've checked your order status. It's currently: {status}",
      "The estimated delivery time for your order is {time}."
    ]
  },
  {
    category: "Support",
    templates: [
      "I understand your concern. Let me help resolve this.",
      "I apologize for the inconvenience. Let me check what happened.",
      "I'll escalate this to our technical team for immediate attention."
    ]
  }
];

export default function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message..."
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    const trimmedMessage = message.trim();
    setMessage("");
    setIsTyping(true);
    
    try {
      await onSendMessage(trimmedMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const insertQuickReply = (reply: string) => {
    setMessage(reply);
    textareaRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Quick Replies */}
      <div className="flex flex-wrap gap-2">
        {QUICK_REPLIES.slice(0, 3).map((reply, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => insertQuickReply(reply)}
                  disabled={disabled}
                  className="text-xs h-8 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Zap className="w-3 h-3 mr-1 text-[#25D366]" />
                  {reply.substring(0, 25)}...
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700">
                <p className="text-slate-200">{reply}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isTyping}
            className={cn(
              "w-full min-h-[60px] max-h-[150px] resize-none px-4 py-3 pr-12 text-sm",
              "bg-slate-950 border border-slate-800 rounded-xl text-white",
              "placeholder:text-slate-600 focus:outline-none focus:border-[#25D366]/50",
              "transition-colors"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          
          <div className="absolute right-3 bottom-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  className="h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800"
                >
                  <MessageSquareQuote className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-slate-900 border-slate-800">
                {MESSAGE_TEMPLATES.map((category, catIndex) => (
                  <div key={catIndex}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      {category.category}
                    </div>
                    {category.templates.map((template, tempIndex) => (
                      <DropdownMenuItem
                        key={tempIndex}
                        onClick={() => setMessage(template)}
                        className="text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                      >
                        {template.substring(0, 40)}...
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Button
          type="submit"
          disabled={!message.trim() || disabled || isTyping}
          className="self-end h-[60px] w-[60px] rounded-xl bg-[#25D366] hover:bg-[#1ea855] text-white p-0"
        >
          {isTyping ? (
            <Clock className="w-5 h-5 animate-pulse" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="sm" disabled={disabled} className="h-8 text-slate-500 hover:text-white">
                  <Paperclip className="w-4 h-4 mr-1" />
                  Attach
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-800 border-slate-700">
                <p className="text-slate-200">Attach files or images</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          {message.length > 0 && (
            <span className={message.length > 500 ? "text-amber-400" : "text-slate-600"}>
              {message.length}/1000
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
