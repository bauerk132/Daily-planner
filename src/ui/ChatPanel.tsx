import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../models/types.ts';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading
}) => {
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const samplePrompts = [
    "I didn't get anything done and it's already 4 PM.",
    "I have a test tomorrow, 3h of job applications, appointment at noon, and need to call assistance office.",
    "I finished the call, what's next?",
    "What are my top 3 priorities today?"
  ];

  return (
    <div className="border border-stone-200 rounded-xl bg-white flex flex-col h-[650px] shadow-xs">
      {/* Header */}
      <div className="p-3.5 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-stone-900">LifeOps Assistant</h3>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Ready & Non-Judgmental
            </span>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="p-2.5 bg-stone-50/70 border-b border-stone-100 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
        <Sparkles className="w-3 h-3 text-stone-400 shrink-0 ml-1" />
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(p)}
            className="px-2 py-0.5 rounded-full bg-white hover:bg-stone-200 border border-stone-200 text-stone-600 whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            "{p.length > 32 ? p.slice(0, 30) + '...' : p}"
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                  isUser ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[82%] p-3 rounded-xl leading-relaxed ${
                  isUser
                    ? 'bg-stone-900 text-stone-50 rounded-tr-none'
                    : 'bg-stone-100/90 text-stone-900 rounded-tl-none border border-stone-200/60'
                }`}
              >
                <div className="whitespace-pre-line">{m.text}</div>
                <div
                  className={`text-[9px] mt-1.5 font-mono ${
                    isUser ? 'text-stone-400 text-right' : 'text-stone-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
            <Bot className="w-3.5 h-3.5 animate-spin" />
            <span>LifeOps is reviewing your schedule...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-stone-100 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Talk to LifeOps (e.g. 'I didn't get anything done and it's 4 PM')..."
          className="flex-1 text-xs px-3 py-2 rounded-lg bg-stone-50 border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          aria-label="Send message"
          className="p-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white transition-colors disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
