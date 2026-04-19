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
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideChat = containerRef.current && !containerRef.current.contains(event.target as Node);
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(event.target as Node);
      
      if (isOutsideChat && isOutsideButton) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle Voice Output (TTS)
  useEffect(() => {
    if (isSpeechEnabled && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "model") {
        const utterance = new SpeechSynthesisUtterance(lastMsg.text);
        utterance.rate = 1;
        utterance.pitch = 1.1; // Slightly higher for a friendly "Maya" vibe
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [messages, isSpeechEnabled]);

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Automatically send if clear
      if (transcript.trim()) {
        setTimeout(() => handleSend(transcript), 500);
      }
    };

    recognition.start();
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
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
      {/* Floating Button (Gemini Style) */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 1000,
          width: 44, height: 44, 
          background: "transparent", border: "none", cursor: "pointer", 
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 0, outline: "none", boxShadow: "none",
          appearance: "none", WebkitTapHighlightColor: "transparent"
        }}
      >
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="gemini"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <img 
                src="/assets/gemini.png" 
                alt="Gemini" 
                style={{ width: 36, height: 36, objectFit: "contain", pointerEvents: "none" }} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="close"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              style={{ 
                width: 36, height: 36, borderRadius: "50%", 
                background: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 20, border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
              }}
            >
              ✕
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95, y: 30, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30, rotateX: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{
              position: "fixed", bottom: 100, right: 24, zIndex: 1000,
              width: "min(380px, 90vw)", height: "min(560px, 75vh)",
              background: "rgba(10, 15, 30, 0.85)", 
              backdropFilter: "blur(24px) saturate(180%)",
              border: "1px solid rgba(251, 191, 36, 0.15)", 
              borderRadius: 32,
              boxShadow: `
                0 0 0 1px rgba(255, 255, 255, 0.05) inset,
                0 10px 40px -10px rgba(0, 0, 0, 0.8),
                0 20px 60px -20px rgba(251, 191, 36, 0.1)
              `,
              display: "flex", flexDirection: "column", overflow: "hidden",
              perspective: "1000px",
              transformOrigin: "bottom right"
            }}
          >
            {/* Header */}
            <div style={{
              padding: "24px 28px", 
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              background: "linear-gradient(to bottom, rgba(251, 191, 36, 0.08), transparent)",
              display: "flex", alignItems: "center", gap: 16
            }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: 14, 
                background: "rgba(5, 10, 24, 0.4)", 
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                color: "#fbbf24"
              }}>
                <img 
                  src="/assets/gemini.png" 
                  alt="Gemini" 
                  style={{ width: 32, height: 32, objectFit: "contain" }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: SERIF, fontSize: 19, color: "#fff", fontWeight: 500, letterSpacing: "0.5px" }}>Maya</div>
                <div style={{ fontFamily: SANS, fontSize: 9, color: "rgba(251, 191, 36, 0.7)", letterSpacing: 2.5, textTransform: "uppercase", marginTop: 2, fontWeight: 600 }}>Your Wedding Guide</div>
              </div>

              {/* Voice Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsSpeechEnabled(!isSpeechEnabled)}
                style={{
                  background: isSpeechEnabled ? "rgba(251, 191, 36, 0.2)" : "transparent",
                  border: "1px solid rgba(251, 191, 36, 0.3)",
                  borderRadius: 12, padding: 8, cursor: "pointer", color: isSpeechEnabled ? "#fbbf24" : "rgba(255,255,255,0.4)"
                }}
              >
                {isSpeechEnabled ? "🔊" : "🔇"}
              </motion.button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ 
              flex: 1, overflowY: "auto", padding: "24px 24px 12px", 
              display: "flex", flexDirection: "column", gap: 20,
              scrollbarWidth: "none"
            }}>
              {messages.length === 0 && (
                <div style={{ 
                  textAlign: "center", padding: "60px 30px", 
                  color: "rgba(255, 255, 255, 0.3)", fontSize: 13, 
                  fontFamily: SANS, lineHeight: 1.6, fontStyle: "italic"
                }}>
                  "Hello! I am Maya, your guide for Niteen and Apoorva's wedding. How may I assist you today?" ✨
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%", padding: "14px 18px", borderRadius: 20,
                  background: m.role === "user" ? "rgba(251, 191, 36, 0.12)" : "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${m.role === "user" ? "rgba(251, 191, 36, 0.25)" : "rgba(255, 255, 255, 0.08)"}`,
                  color: "#e2e8f0", fontSize: 14, fontFamily: SANS, lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  wordBreak: "break-word",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)",
                }}>
                  {m.text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\)|https?:\/\/\S+)/).map((part, idx) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={idx} style={{ color: "#fbbf24", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
                    }
                    if (part.startsWith("[") && part.includes("](")) {
                      const match = part.match(/\[(.*?)\]\((.*?)\)/);
                      if (match) {
                        return <a key={idx} href={match[2]} target="_blank" rel="noopener noreferrer" style={{ color: "#fbbf24", textDecoration: "none", borderBottom: "1px dashed rgba(251, 191, 36, 0.4)", fontWeight: 500 }}>{match[1]}</a>;
                      }
                    }
                    if (part.startsWith("http")) {
                      return <a key={idx} href={part} target="_blank" rel="noopener noreferrer" style={{ color: "#fbbf24", textDecoration: "none", borderBottom: "1px dashed rgba(251, 191, 36, 0.4)", fontWeight: 500 }}>{part}</a>;
                    }
                    return part;
                  })}
                </div>
              ))}
              {isLoading && (
                <div style={{ alignSelf: "flex-start", padding: "12px 16px", borderRadius: 16, background: "rgba(255,255,255,0.03)", color: "rgba(251, 191, 36, 0.5)", fontSize: 11, letterSpacing: 1, fontFamily: SANS }}>
                  <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}>Typing...</motion.span>
                </div>
              )}
            </div>

            {/* Input Container */}
            <div style={{ padding: "20px 24px 28px" }}>
              <div style={{ 
                display: "flex", gap: 12, alignItems: "center",
                background: "rgba(255, 255, 255, 0.03)", 
                border: "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: 20, padding: "6px 6px 6px 12px",
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.2)"
              }}>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleVoiceInput}
                  style={{
                    background: isListening ? "#ef4444" : "transparent",
                    border: "none", padding: 8, borderRadius: 12, cursor: "pointer",
                    color: isListening ? "#fff" : "rgba(255,255,255,0.4)",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </motion.button>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSend()}
                  placeholder={isListening ? "Listening..." : "Type or speak..."}
                  style={{
                    flex: 1, background: "transparent", border: "none",
                    color: "#fff", fontFamily: SANS, outline: "none",
                    fontSize: 14
                  }}
                />
                <motion.button
                  whileHover={{ scale: 1.05, background: "#f59e0b" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSend()}
                  style={{
                    width: 44, height: 44, borderRadius: 16, border: "1px solid rgba(251, 191, 36, 0.4)",
                    background: "rgba(5, 10, 24, 0.6)", cursor: "pointer", 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    color: "#fbbf24"
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
