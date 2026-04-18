import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SERIF = '"Playfair Display", serif';
const SANS = "Inter, sans-serif";

export default function AIConcierge() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: "model", text: data.text || data.error }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "model", text: "I'm having trouble connecting right now. ✨" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 56, height: 56, borderRadius: "50%",
          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
          border: "none", boxShadow: "0 8px 32px rgba(245,158,11,0.4)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24
        }}
      >
        {isOpen ? "✕" : "✨"}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: "fixed", bottom: 92, right: 24, zIndex: 1000,
              width: "min(400px, 90vw)", height: "min(500px, 70vh)",
              background: "rgba(5,10,24,0.95)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(251,191,36,0.2)", borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              display: "flex", flexDirection: "column", overflow: "hidden"
            }}
          >
            {/* Header */}
            <div style={{
              padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(251,191,36,0.05)"
            }}>
              <div style={{ fontFamily: SERIF, fontSize: 18, color: "#fff8ef" }}>Wedding Concierge</div>
              <div style={{ fontFamily: SANS, fontSize: 10, color: "rgba(251,191,36,0.8)", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Powered by Gemini AI</div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: SANS }}>
                  Hello! I'm your AI assistant for Niteen & Apoorva's wedding. Ask me anything about the events, dress code, or locations! ✨
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%", padding: "12px 16px", borderRadius: 16,
                  background: m.role === "user" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${m.role === "user" ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: "#fff8ef", fontSize: 14, fontFamily: SANS, lineHeight: 1.5
                }}>
                  {m.text}
                </div>
              ))}
              {isLoading && (
                <div style={{ alignSelf: "flex-start", padding: "12px 16px", borderRadius: 16, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                  Typing...
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", gap: 12 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder="Ask a question..."
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12, padding: "10px 16px", color: "#fff8ef", fontFamily: SANS, outline: "none"
                  }}
                />
                <button
                  onClick={handleSend}
                  style={{
                    width: 42, height: 42, borderRadius: 12, border: "none",
                    background: "#fbbf24", cursor: "pointer", fontSize: 18
                  }}
                >
                  ↑
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
