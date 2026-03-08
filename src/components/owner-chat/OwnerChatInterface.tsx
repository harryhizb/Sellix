"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, User, Bot, AlertCircle, Phone,
  ShoppingCart, FileText, History, Hand, Sparkles,
  CheckCheck, Clock
} from "lucide-react";
import TakeoverButton from "./TakeoverButton";
import ConversationHistory from "./ConversationHistory";
import MessageInput from "./MessageInput";
import TakeoverStatusPanel from "./TakeoverStatusPanel";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OwnerChatInterfaceProps {
  businessId: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
  };
  initialMessages?: any[];
  takeoverStatus?: any;
}

export default function OwnerChatInterface({
  businessId,
  customer,
  initialMessages = [],
  takeoverStatus
}: OwnerChatInterfaceProps) {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [isInTakeover, setIsInTakeover] = useState(!!takeoverStatus?.isInTakeover);
  const [takeoverData, setTakeoverData] = useState(takeoverStatus);
  const [activeTab, setActiveTab] = useState("chat");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/conversations/${customer.id}/stream?businessId=${businessId}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        setMessages(prev => [...prev, data.message]);
      } else if (data.type === 'takeover_status') {
        setIsInTakeover(data.isActive);
        setTakeoverData(data);
      }
    };

    return () => eventSource.close();
  }, [businessId, customer.id]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleTakeoverStart = async (reason: string, notes?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/conversations/takeover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          businessId,
          reason,
          notes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIsInTakeover(true);
        setTakeoverData(data);
        await loadConversationContext();
      }
    } catch (error) {
      console.error("Takeover start error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHandback = async (summary: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/conversations/handback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          businessId,
          summary
        })
      });

      if (response.ok) {
        setIsInTakeover(false);
        setTakeoverData(null);
      }
    } catch (error) {
      console.error("Handback error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const response = await fetch(`/api/conversations/${customer.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, content })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          id: data.messageId,
          from: "owner",
          content,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const loadConversationContext = async () => {
    try {
      const response = await fetch(
        `/api/conversations/takeover/context?customerId=${customer.id}&businessId=${businessId}`
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Load context error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold">
              {customer.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <h3 className="font-semibold text-white">{customer.name}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{customer.phone}</span>
                {isInTakeover && (
                  <Badge className="ml-2 bg-amber-500/10 text-amber-400 border-amber-500/20">
                    <Hand className="w-3 h-3 mr-1" />
                    You&apos;re in control
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <TakeoverButton
            isInTakeover={isInTakeover}
            onTakeoverStart={handleTakeoverStart}
            onHandback={handleHandback}
            isLoading={isLoading}
            customerId={customer.id}
            businessId={businessId}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-slate-800 bg-slate-900/30">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full rounded-none border-b border-slate-800 bg-slate-900 p-0 h-12">
              <TabsTrigger value="chat" className="flex-1 rounded-none data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="info" className="flex-1 rounded-none data-[state=active]:bg-slate-800 data-[state=active]:text-white">
                <FileText className="w-4 h-4 mr-2" />
                Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="h-[calc(100%-48px)] m-0 p-4">
              {isInTakeover ? (
                <TakeoverStatusPanel
                  takeoverData={takeoverData}
                  onForceHandback={() => handleHandback("Force handback by admin")}
                />
              ) : (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-center">
                  <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-[#25D366]" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">AI Active</h3>
                  <p className="text-sm text-slate-500 mb-4">
                    The AI assistant is handling this conversation.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full border-slate-700 text-white hover:bg-slate-800"
                    onClick={() => handleTakeoverStart("customer_request")}
                  >
                    <Hand className="w-4 h-4 mr-2" />
                    Take Over
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="h-[calc(100%-48px)] m-0 p-4 space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Customer Info
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Name:</dt>
                    <dd className="text-white">{customer.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Phone:</dt>
                    <dd className="text-white">{customer.phone}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Status:</dt>
                    <dd>
                      <Badge className={isInTakeover ? "bg-amber-500/10 text-amber-400" : "bg-[#25D366]/10 text-[#25D366]"}>
                        {isInTakeover ? "Human Support" : "AI Support"}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-slate-400" />
                  Recent Orders
                </h4>
                <p className="text-sm text-slate-500 text-center py-4">
                  No recent orders
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-950">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id || message._id}
                className={cn("flex", message.from === "customer" ? "justify-start" : "justify-end")}
              >
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3",
                  message.from === "customer" ? "bg-slate-800 text-white rounded-tl-sm" :
                  message.from === "ai" ? "bg-slate-800/50 border border-slate-700/50 text-slate-200 rounded-tr-sm" :
                  "bg-[#25D366] text-white rounded-tr-sm"
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    {message.from === "ai" && <Bot className="w-3.5 h-3.5 text-[#25D366]" />}
                    {message.from === "owner" && <User className="w-3.5 h-3.5" />}
                    <span className={cn("text-xs", message.from === "owner" ? "text-white/70" : "text-slate-500")}>
                      {message.from === "customer" ? "Customer" : message.from === "ai" ? "AI" : "You"} • {format(
                        new Date(message.createdAt || message.timestamp),
                        "HH:mm"
                      )}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p>No messages yet. Start the conversation.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 p-4 bg-slate-900/50">
            {isInTakeover ? (
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!isInTakeover}
                placeholder="Type your message..."
              />
            ) : (
              <div className="text-center py-3 text-sm text-slate-500">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Take over the conversation to send messages
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
