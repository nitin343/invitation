import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Language, translations } from "../i18n";

const GOLD = "rgba(251, 191, 36, 1)";
const SANS = '"Montserrat", sans-serif';
const SERIF = '"Cormorant Garamond", serif';

interface WelcomeFlowProps {
  onComplete: (lang: Language, team: 'groom' | 'bride') => void;
}

export default function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [step, setStep] = useState<'ganpati' | 'language' | 'team'>('ganpati');
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const [selectedTeam, setSelectedTeam] = useState<'groom' | 'bride' | null>(null);

  useEffect(() => {
    if (step === 'ganpati') {
      const timer = setTimeout(() => setStep('language'), 3500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleLanguageSelect = (lang: Language) => {
    setSelectedLang(lang);
    setStep('team');
  };

  const handleTeamSelect = (team: 'groom' | 'bride') => {
    setSelectedTeam(team);
    setTimeout(() => onComplete(selectedLang, team), 800);
  };

  const t = translations[selectedLang];

  return (
    <div style={{ 
      position: "fixed", inset: 0, zIndex: 10000, 
      backgroundImage: "url(/assets/frame2.jpeg)",
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
              src="/assets/ganesh-opt.png" 
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
              || श्री गणेशाय नमः ||
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
            <div style={{ fontFamily: SANS, fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#8C6B3B", fontWeight: 600 }}>
              Choose Your Language<br/><span style={{ fontSize: 12, letterSpacing: 2, marginTop: 8, display: "block" }}>ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</span>
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
            style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row", position: "relative", background: "linear-gradient(90deg, rgba(200,169,106,0.08) 0%, transparent 50%, rgba(200,169,106,0.08) 100%)" }}
          >
            {/* Center prompt */}
            <div style={{ position: "absolute", top: "16%", width: "100%", textAlign: "center", letterSpacing: 6, fontSize: 12, color: "#8C6B3B", fontFamily: SANS, fontWeight: 600, pointerEvents: "none", textTransform: "uppercase", opacity: 0.8 }}>
              Where Do You Belong
            </div>

            {/* Center divider with glow */}
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, background: "linear-gradient(to bottom, transparent, rgba(200,169,106,0.8), transparent)", boxShadow: "0 0 16px rgba(200,169,106,0.4)", opacity: 0.6, pointerEvents: "none" }} />

            {/* Left - Groom */}
            <motion.div
              whileHover={selectedTeam === null ? { scale: 1.06 } : undefined}
              onClick={() => handleTeamSelect('groom')}
              animate={selectedTeam ? {
                flex: selectedTeam === 'groom' ? 1 : 0.1,
                opacity: selectedTeam === 'groom' ? 1 : 0,
                scale: selectedTeam === 'groom' ? 1.15 : 0.9,
              } : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                padding: "20px",
                position: "relative",
                zIndex: 2,
              }}
              data-side="left"
              onMouseEnter={(e) => {
                if (selectedTeam !== null) return;
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
              {/* Glow background */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 30% 50%, rgba(122, 92, 46, 0.25), transparent 60%)", opacity: selectedTeam === 'groom' ? 1 : 0.7, pointerEvents: "none", borderRadius: "0", transition: "opacity 0.8s ease" }} />
              
              <motion.div
                animate={{ y: selectedTeam === null ? [0, -8, 0] : 0 }}
                transition={{ duration: 6, repeat: selectedTeam === null ? Infinity : 0, ease: "easeInOut" }}
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
                <div style={{ fontFamily: SANS, fontSize: "clamp(10px, 2vw, 12px)", letterSpacing: 3, textTransform: "uppercase", color: "#8C6B3B", marginBottom: 16, opacity: 0.7, fontWeight: 700, textAlign: "center" }}>
                  Niteen's Side
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: "clamp(20px, 5vw, 44px)",
                    fontWeight: 500,
                    color: "#6F5228",
                    textShadow: "0 2px 10px rgba(0,0,0,0.15)",
                    letterSpacing: 1,
                    textAlign: "center",
                    maxWidth: "85%",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {t.groom}
                </div>
              </motion.div>
            </motion.div>

            {/* Right - Bride */}
            <motion.div
              whileHover={selectedTeam === null ? { scale: 1.06 } : undefined}
              onClick={() => handleTeamSelect('bride')}
              animate={selectedTeam ? {
                flex: selectedTeam === 'bride' ? 1 : 0.1,
                opacity: selectedTeam === 'bride' ? 1 : 0,
                scale: selectedTeam === 'bride' ? 1.15 : 0.9,
              } : undefined}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
                padding: "20px",
                position: "relative",
                zIndex: 2,
              }}
              data-side="right"
              onMouseEnter={(e) => {
                if (selectedTeam !== null) return;
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
              {/* Glow background */}
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 70% 50%, rgba(176, 122, 106, 0.25), transparent 60%)", opacity: selectedTeam === 'bride' ? 1 : 0.7, pointerEvents: "none", borderRadius: "0", transition: "opacity 0.8s ease" }} />
              
              <motion.div
                animate={{ y: selectedTeam === null ? [0, -8, 0] : 0 }}
                transition={{ duration: 6, repeat: selectedTeam === null ? Infinity : 0, ease: "easeInOut", delay: 0.3 }}
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
                <div style={{ fontFamily: SANS, fontSize: "clamp(10px, 2vw, 12px)", letterSpacing: 3, textTransform: "uppercase", color: "#8C6B3B", marginBottom: 16, opacity: 0.7, fontWeight: 700, textAlign: "center" }}>
                  Apoorva's Side
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontSize: "clamp(20px, 5vw, 44px)",
                    fontWeight: 500,
                    color: "#A46A5E",
                    textShadow: "0 2px 10px rgba(0,0,0,0.15)",
                    letterSpacing: 1,
                    textAlign: "center",
                    maxWidth: "85%",
                    lineHeight: 1.3,
                    wordBreak: "break-word",
                  }}
                >
                  {t.bride}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
