import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 mb-4", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-sm font-bold text-teal-700">🤖</span>
        </div>
      )}
      <div
        className={cn(
          "max-w-sm rounded-lg px-4 py-3",
          isUser
            ? "bg-teal-600 text-white rounded-br-none"
            : "bg-slate-100 text-slate-900 rounded-bl-none"
        )}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          <ReactMarkdown className="text-sm prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}