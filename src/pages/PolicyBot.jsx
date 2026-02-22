import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Send, BookOpen } from "lucide-react";
import ChatBubble from "@/components/bot/ChatBubble";
import PolicyUploadModal from "@/components/bot/PolicyUploadModal";

export default function PolicyBot() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: policies = [] } = useQuery({
    queryKey: ["policies"],
    queryFn: () => base44.entities.Policy.filter({ is_active: true }, "-created_date", 50),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startNewConversation = async () => {
    const conv = await base44.agents.createConversation({
      agent_name: "PolicyBot",
      metadata: { name: `Chat - ${new Date().toLocaleTimeString()}` },
    });
    setCurrentConversation(conv);
    setMessages([]);
    setConversations([conv, ...conversations]);
  };

  const loadConversation = async (conv) => {
    const loaded = await base44.agents.getConversation(conv.id);
    setCurrentConversation(loaded);
    setMessages(loaded.messages || []);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentConversation) return;

    const userMessage = inputValue;
    setInputValue("");
    setIsLoading(true);

    // Add user message to display
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    // Send to agent
    await base44.agents.addMessage(currentConversation, {
      role: "user",
      content: userMessage,
    });

    // Subscribe to updates
    const unsubscribe = base44.agents.subscribeToConversation(currentConversation.id, (data) => {
      setMessages(data.messages);
    });

    setIsLoading(false);

    return () => unsubscribe();
  };

  if (!currentConversation) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">OR Assistant Bot</h1>
              <p className="text-slate-600 mt-1">Policy Q&A, surgeon preferences & room setup reminders</p>
            </div>
            <Button
              onClick={() => setUploadOpen(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Upload Policy
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-teal-600">{policies.length}</div>
              <div className="text-sm text-slate-600">Policies Available</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-blue-600">{conversations.length}</div>
              <div className="text-sm text-slate-600">Conversations</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-2xl font-bold text-amber-600">24/7</div>
              <div className="text-sm text-slate-600">Available</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-600" /> Quick Start
              </h2>
              <Button
                onClick={startNewConversation}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                Start Chat Session
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-bold text-slate-900 mb-4">Recent Chats</h2>
              <div className="space-y-2">
                {conversations.length === 0 ? (
                  <p className="text-sm text-slate-400">No conversations yet</p>
                ) : (
                  conversations.slice(0, 3).map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv)}
                      className="w-full text-left text-sm p-2 rounded hover:bg-slate-50 border border-slate-200 transition-colors"
                    >
                      {conv.metadata?.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <PolicyUploadModal
            open={uploadOpen}
            onClose={() => setUploadOpen(false)}
            onPolicySaved={() => queryClient.invalidateQueries({ queryKey: ["policies"] })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] p-6">
      <div className="max-w-2xl mx-auto h-screen flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900">OR Assistant</h1>
          <Button
            onClick={startNewConversation}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1" /> New Chat
          </Button>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 overflow-y-auto mb-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <BookOpen className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">Ask about policies, surgeon preferences, or room setup</p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <ChatBubble key={idx} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Ask me about policies, surgeon preferences, or room setup..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}