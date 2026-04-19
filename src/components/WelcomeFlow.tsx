import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Language, translations } from "../i18n";
import { getCDNUrl } from "../utils/cdn";

const GOLD = "rgba(251, 191, 36, 1)";
const SANS = '"Montserrat", sans-serif';
const SERIF = '"Cormorant Garamond", serif';

// Haptic feedback utilities
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!navigator.vibrate) return;
  
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: [20, 10, 20],
    heavy: [30, 15, 30],
  };
  
  navigator.vibrate(patterns[type]);
};

interface WelcomeFlowProps {
  onComplete: (lang: Language, team: 'groom' | 'bride') => void;
}

export default function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [step, setStep] = useState<'ganpati' | 'language' | 'team'>('ganpati');
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [selectedTeam, setSelectedTeam] = useState<'groom' | 'bride' | null>(null);

  // Test CDN URL generation
  const frameUrl = getCDNUrl('frame4', { width: 1200 });
  const ganeshUrl = getCDNUrl('ganesh', { width: 600 });

  useEffect(() => {
    if (step === 'ganpati') {
      const timer = setTimeout(() => setStep('language'), 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleLanguageSelect = (lang: Language) => {
    triggerHaptic('light');
    setSelectedLang(lang);
    setStep('team');
  };

  const handleTeamSelect = (team: 'groom' | 'bride') => {
    triggerHaptic('heavy');
    setSelectedTeam(team);
    setTimeout(() => onComplete(selectedLang, team), 800);
  };

  const t = translations[selectedLang];

  return (
    <div style={{ 
      position: "fixed", inset: 0, zIndex: 10000, 
      backgroundImage: `url(${frameUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundColor: "#050a18",
      color: "#fff",
      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <AnimatePresence mode="wait">
        {step === 'ganpati' && (
          <motion.div
            key="ganpati"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            style={{ textAlign: "center" }}
          >
            <motion.img
              src={ganeshUrl}
              alt="Ganesh" 
              initial={{ scale: 0.8, filter: "brightness(0)" }}
              animate={{ scale: 1, filter: "brightness(1)" }}
              transition={{ duration: 2, ease: "easeOut" }}
              style={{ width: "min(300px, 70vw)", height: "auto", marginBottom: 30 }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 1 }}
              style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: 2, color: GOLD }}
            >
              ॐ गं गणपतये नमः
            </motion.div>
          </motion.div>
        )}

        {step === 'language' && (
          <motion.div
            key="language"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}
          >
            <div style={{ fontFamily: SANS, fontSize: 14, letterSpacing: 0, wordSpacing: "0.15em", textTransform: "uppercase", color: "#8C6B3B", fontWeight: 600 }}>
              Choose Your Language<br/><span style={{ fontFamily: '"Noto Serif Kannada", serif', fontSize: 16, letterSpacing: 0, wordSpacing: "0.2em", marginTop: 12, display: "block", color: "#7A5C2E", fontWeight: 500, lineHeight: 1.7, maxWidth: "280px", margin: "12px auto 0", opacity: 1 }}>ನಮ್ಮ ವಿಶೇಷ ದಿನಕ್ಕೆ<br/>ನಿಮ್ಮನ್ನು ಆಹ್ವಾನಿಸುತ್ತೇವೆ</span>
            </div>
            {[
              { id: 'en', label: 'English' },
              { id: 'kn', label: 'ಕನ್ನಡ' },
              { id: 'hi', label: 'हिंदी' }
            ].map((lang) => (
              <motion.button
                key={lang.id}
                whileHover={{ y: -4, scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleLanguageSelect(lang.id as Language)}
                onTouchStart={() => triggerHaptic('light')}
                style={{
                  width: 260, padding: "18px 24px", borderRadius: 14,
                  background: "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,238,225,0.8))",
                  border: "2px solid #C8A96A",
                  color: "#5A4632", fontSize: 16, fontFamily: SANS, cursor: "pointer", fontWeight: 600,
                  backdropFilter: "blur(8px)",
                  transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  boxShadow: "0 6px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 12px rgba(200,169,106,0.25)",
                  outline: "none"
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(180deg, rgba(255,255,255,1), rgba(248,242,230,0.95))";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#B8964F";
                  (e.currentTarget as HTMLButtonElement).style.color = "#9C7B3F";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.9), 0 0 24px rgba(200,169,106,0.5)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,238,225,0.8))";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#C8A96A";
                  (e.currentTarget as HTMLButtonElement).style.color = "#5A4632";
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 12px rgba(200,169,106,0.25)";
                }}
              >
                {lang.label}
              </motion.button>
            ))}
          </motion.div>
        )}

        {step === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", display: "flex", flexDirection: "row", background: "linear-gradient(135deg, rgba(200,169,106,0.15) 0%, rgba(176,122,106,0.1) 50%, rgba(200,169,106,0.15) 100%)", zIndex: 50 }}
          >
            {/* Backdrop overlay */}
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(0,0,0,0.2), rgba(0,0,0,0.4))", pointerEvents: "none" }} />
            
            {/* Center prompt */}
            <div style={{ position: "absolute", top: "14%", left: "50%", transform: "translateX(-50%)", width: "100%", textAlign: "center", letterSpacing: selectedLang === 'kn' || selectedLang === 'hi' ? 0 : 6, wordSpacing: selectedLang === 'kn' || selectedLang === 'hi' ? "0.15em" : undefined, fontSize: 12, color: "#E8DFD0", fontFamily: SANS, fontWeight: 600, pointerEvents: "none", textTransform: "uppercase", opacity: 0.9, zIndex: 10 }}>
              {t.selectTeam}
            </div>

            {/* Center divider with glow */}
            <div style={{ position: "absolute", left: "50%", top: "30%", bottom: "20%", width: 2, background: "linear-gradient(to bottom, transparent, rgba(200,169,106,0.8), transparent)", boxShadow: "0 0 20px rgba(200,169,106,0.5), 0 0 40px rgba(200,169,106,0.2)", opacity: 0.7, pointerEvents: "none", zIndex: 5 }} />

            {/* Left - Groom */}
            <motion.div
              whileHover={selectedTeam === null ? { scale: 1.06 } : undefined}
              onClick={() => handleTeamSelect('groom')}
              onTouchStart={() => {
                if (selectedTeam === null) triggerHaptic('medium');
              }}
              animate={selectedTeam ? {
                flex: selectedTeam === 'groom' ? 1 : 0.08,
                opacity: selectedTeam === 'groom' ? 1 : 0.3,
              } : {}}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                padding: "20px",
                position: "relative",
                zIndex: 2,
              }}
              data-side="left"
              onMouseEnter={(e) => {
                if (selectedTeam !== null) return;
                triggerHaptic('light');
                const container = (e.currentTarget?.parentElement as HTMLDivElement);
                if (container) {
                  const rightSide = container.querySelector('[data-side="right"]') as HTMLDivElement;
                  if (rightSide) {
                    rightSide.style.opacity = "0.55";
                  }
                }
                (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                if (selectedTeam !== null) return;
                const container = (e.currentTarget?.parentElement as HTMLDivElement);
                if (container) {
                  const rightSide = container.querySelector('[data-side="right"]') as HTMLDivElement;
                  if (rightSide) {
                    rightSide.style.opacity = "1";
                  }
                }
                (e.currentTarget as HTMLDivElement).style.filter = "brightness(1)";
              }}
            >
              {/* Glow background - enhanced */}
              <motion.div 
                animate={{ 
                  opacity: selectedTeam === 'groom' ? 1 : 0.4,
                  scale: selectedTeam === 'groom' ? 1 : 0.8,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 50%, rgba(122, 92, 46, 0.35), transparent 60%)", pointerEvents: "none", borderRadius: "0" }} 
              />
              
              <motion.div
                animate={selectedTeam === 'groom' ? {
                  y: 0,
                  opacity: 1,
                  scale: 1,
                } : selectedTeam === null ? {
                  y: [0, -8, 0],
                  opacity: 1,
                  scale: 1,
                } : {
                  y: -20,
                  opacity: 0,
                  scale: 0.8,
                }}
                transition={selectedTeam === null ? {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                } : {
                  duration: 0.6,
                  delay: 0.1,
                  ease: "easeOut",
                }}
                style={{
                  position: "relative",
                  zIndex: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  maxWidth: "90%",
                }}
              >
                <motion.div 
                  animate={selectedTeam ? {
                    opacity: selectedTeam === 'groom' ? 1 : 0,
                    y: selectedTeam === 'groom' ? 0 : -10,
                  } : {}}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  style={{ fontFamily: SANS, fontSize: "clamp(10px, 2vw, 12px)", letterSpacing: 3, textTransform: "uppercase", color: "#8C6B3B", marginBottom: 16, opacity: 0.7, fontWeight: 700, textAlign: "center" }}
                >
                  Niteen's Side
                </motion.div>
                <motion.div
                  animate={selectedTeam ? {
                    opacity: selectedTeam === 'groom' ? 1 : 0,
                    y: selectedTeam === 'groom' ? 0 : 10,
                    scale: selectedTeam === 'groom' ? 1 : 0.9,
                  } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    fontFamily: SERIF,
                    fontSize: "clamp(20px, 5vw, 44px)",
                    fontWeight: 500,
                    color: "#6F5228",
                    textShadow: "0 4px 20px rgba(0,0,0,0.2)",
                    letterSpacing: 1,
                    textAlign: "center",
                    maxWidth: "85%",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {t.groom}
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right - Bride */}
            <motion.div
              whileHover={selectedTeam === null ? { scale: 1.06 } : undefined}
              onClick={() => handleTeamSelect('bride')}
              onTouchStart={() => {
                if (selectedTeam === null) triggerHaptic('medium');
              }}
              animate={selectedTeam ? {
                flex: selectedTeam === 'bride' ? 1 : 0.08,
                opacity: selectedTeam === 'bride' ? 1 : 0.3,
              } : {}}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                padding: "20px",
                position: "relative",
                zIndex: 2,
              }}
              data-side="right"
              onMouseEnter={(e) => {
                if (selectedTeam !== null) return;
                triggerHaptic('light');
                const container = (e.currentTarget?.parentElement as HTMLDivElement);
                if (container) {
                  const leftSide = container.querySelector('[data-side="left"]') as HTMLDivElement;
                  if (leftSide) {
                    leftSide.style.opacity = "0.55";
                  }
                }
                (e.currentTarget as HTMLDivElement).style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => {
                if (selectedTeam !== null) return;
                const container = (e.currentTarget?.parentElement as HTMLDivElement);
                if (container) {
                  const leftSide = container.querySelector('[data-side="left"]') as HTMLDivElement;
                  if (leftSide) {
                    leftSide.style.opacity = "1";
                  }
                }
                (e.currentTarget as HTMLDivElement).style.filter = "brightness(1)";
              }}
            >
              {/* Glow background - enhanced */}
              <motion.div 
                animate={{ 
                  opacity: selectedTeam === 'bride' ? 1 : 0.4,
                  scale: selectedTeam === 'bride' ? 1 : 0.8,
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 50%, rgba(176, 122, 106, 0.35), transparent 60%)", pointerEvents: "none", borderRadius: "0" }} 
              />
              
              <motion.div
                animate={selectedTeam === 'bride' ? {
                  y: 0,
                  opacity: 1,
                  scale: 1,
                } : selectedTeam === null ? {
                  y: [0, -8, 0],
                  opacity: 1,
                  scale: 1,
                } : {
                  y: -20,
                  opacity: 0,
                  scale: 0.8,
                }}
                transition={selectedTeam === null ? {
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                } : {
                  duration: 0.6,
                  delay: 0.1,
                  ease: "easeOut",
                }}
                style={{
                  position: "relative",
                  zIndex: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  maxWidth: "90%",
                }}
              >
                <motion.div 
                  animate={selectedTeam ? {
                    opacity: selectedTeam === 'bride' ? 1 : 0,
                    y: selectedTeam === 'bride' ? 0 : -10,
                  } : {}}
                  transition={{ duration: 0.4, delay: 0.15 }}
                  style={{ fontFamily: SANS, fontSize: "clamp(10px, 2vw, 12px)", letterSpacing: 3, textTransform: "uppercase", color: "#8C6B3B", marginBottom: 16, opacity: 0.7, fontWeight: 700, textAlign: "center" }}
                >
                  Apoorva's Side
                </motion.div>
                <motion.div
                  animate={selectedTeam ? {
                    opacity: selectedTeam === 'bride' ? 1 : 0,
                    y: selectedTeam === 'bride' ? 0 : 10,
                    scale: selectedTeam === 'bride' ? 1 : 0.9,
                  } : {}}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    fontFamily: SERIF,
                    fontSize: "clamp(20px, 5vw, 44px)",
                    fontWeight: 500,
                    color: "#A46A5E",
                    textShadow: "0 4px 20px rgba(0,0,0,0.2)",
                    letterSpacing: 1,
                    textAlign: "center",
                    maxWidth: "85%",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {t.bride}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
