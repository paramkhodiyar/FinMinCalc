"use client";

import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, BrainCircuit } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function RightPanel({ analysisData, triggerAi }: { analysisData?: any, triggerAi?: number }) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      content: "Hello! I'm your FinCalc AI assistant. Enter your data and click 'Generate Analysis' to get started." 
    }
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle automatic analysis when triggered
  useEffect(() => {
    if (triggerAi && analysisData) {
      handleSend("Please provide a detailed financial analysis of this NPV profile, highlighting the IRR and the project's sensitivity to interest rates.");
    }
  }, [triggerAi]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim()) return;
    
    const userMessage = { role: "user", content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInput("");
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMessage],
          context: analysisData 
        }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        const errorMessage = typeof data.error === 'object' 
          ? (data.error.message || JSON.stringify(data.error)) 
          : data.error;
          
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `AI Error: ${errorMessage}` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: data.choices[0].message.content 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error connecting to the AI service." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-[350px] h-screen bg-white border-l border-[var(--color-border)] flex flex-col">
      <div className="p-6 border-b border-[var(--color-border)] flex items-center gap-2">
        <BrainCircuit className="text-[var(--color-accent)] w-5 h-5" />
        <span className="font-semibold text-lg">AI Insights</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                m.role === "user" 
                  ? "bg-[var(--color-accent)] text-white rounded-tr-none" 
                  : "bg-[var(--color-secondary)] text-[var(--color-foreground)] rounded-tl-none chat-markdown"
              }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-[var(--color-secondary)] text-gray-400 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                Thinking...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 border-t border-[var(--color-border)]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your NPV analysis..."
            className="premium-input pr-10 py-3"
          />
          <button 
            onClick={() => handleSend()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-accent)] hover:bg-[var(--color-secondary)] rounded-md transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest font-medium justify-center">
          <Sparkles size={10} />
          <span>Powered by Groq</span>
        </div>
      </div>
    </div>
  );
}
