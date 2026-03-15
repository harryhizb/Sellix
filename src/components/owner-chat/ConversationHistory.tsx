"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Download, Bot, User, Clock, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ConversationHistoryProps {
  customerId: string;
  businessId: string;
}

export default function ConversationHistory({
  customerId,
  businessId
}: ConversationHistoryProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");



  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/conversations/${customerId}/history?businessId=${businessId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Load history error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId, businessId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = searchQuery === "" || 
      message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === "all" ||
      (filter === "customer" && message.from === "customer") ||
      (filter === "owner" && message.from === "owner") ||
      (filter === "ai" && message.from === "ai");
    
    return matchesSearch && matchesFilter;
  });

  const exportHistory = () => {
    const dataStr = JSON.stringify(messages, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `conversation-history-${customerId}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[120px] bg-slate-950 border-slate-800 text-white">
              <Filter className="w-4 h-4 mr-2 text-slate-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800">
              <SelectItem value="all" className="text-slate-300">All</SelectItem>
              <SelectItem value="customer" className="text-slate-300">Customer</SelectItem>
              <SelectItem value="ai" className="text-slate-300">AI</SelectItem>
              <SelectItem value="owner" className="text-slate-300">Owner</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportHistory} className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800">
            <Download className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">{filteredMessages.length} messages</span>
          <Button variant="ghost" size="sm" onClick={loadHistory} className="text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-700 border-t-[#25D366] rounded-full animate-spin mx-auto mb-4" />
            Loading history...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-slate-600" />
            </div>
            No messages found
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredMessages.map((message, index) => (
              <div
                key={message.id || message._id || index}
                className={cn(
                  "border rounded-xl p-3 space-y-2",
                  message.from === "customer" ? "bg-slate-900 border-slate-800" :
                  message.from === "ai" ? "bg-[#25D366]/5 border-[#25D366]/20" :
                  "bg-slate-800/50 border-slate-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {message.from === "ai" && (
                      <Badge className="bg-[#25D366]/10 text-[#25D366] border-[#25D366]/20 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        AI
                      </Badge>
                    )}
                    {message.from === "owner" && (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        You
                      </Badge>
                    )}
                    {message.from === "customer" && (
                      <Badge className="bg-slate-700 text-slate-300 border-slate-600 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Customer
                      </Badge>
                    )}
                    
                    {message.source && (
                      <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                        {message.source}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    {format(
                      new Date(message.createdAt || message.timestamp),
                      "MMM d, HH:mm"
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{message.content}</p>
                
                {message.hasMedia && (
                  <div className="text-xs text-[#25D366]">
                    📎 Contains media
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
