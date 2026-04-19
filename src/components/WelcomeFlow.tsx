import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Language, translations } from "../i18n";

const GOLD = "rgba(251, 191, 36, 1)";
const SANS = "Inter, sans-serif";
const SERIF = '"Playfair Display", serif';

interface WelcomeFlowProps {
  onComplete: (lang: Language, team: 'groom' | 'bride') => void;
}

export default function WelcomeFlow({ onComplete }: WelcomeFlowProps) {
  const [step, setStep] = useState<'ganpati' | 'language' | 'team'>('ganpati');
  const [selectedLang, setSelectedLang] = useState<Language>('en');

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
    onComplete(selectedLang, team);
  };

  const t = translations[selectedLang];

  return (
    <div style={{ 
      position: "fixed", inset: 0, zIndex: 10000, 
      background: "#050a18", color: "#fff",
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
              style={{ fontFamily: SERIF, fontSize: 24, letterSpacing: 4, color: GOLD }}
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
            style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}
          >
            <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>
              Select Language / ಭಾಷೆಯನ್ನು ಆರಿಸಿ
            </div>
            {[
              { id: 'en', label: 'English' },
              { id: 'kn', label: 'ಕನ್ನಡ' },
              { id: 'hi', label: 'हिंदी' }
            ].map((lang) => (
              <motion.button
                key={lang.id}
                whileHover={{ scale: 1.05, background: "rgba(251, 191, 36, 0.15)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLanguageSelect(lang.id as Language)}
                style={{
                  width: 240, padding: "16px 20px", borderRadius: 16,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(251, 191, 36, 0.2)",
                  color: "#fff", fontSize: 16, fontFamily: SANS, cursor: "pointer"
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
            style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row" }}
          >
            <motion.div
              whileHover={{ flex: 1.5 }}
              onClick={() => handleTeamSelect('groom')}
              style={{
                flex: 1, background: "linear-gradient(to right, rgba(251, 191, 36, 0.05), transparent)",
                borderRight: "1px solid rgba(251, 191, 36, 0.1)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "flex 0.5s ease"
              }}
            >
              <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: 5, textTransform: "uppercase", color: GOLD, marginBottom: 12 }}>Niteen's</div>
              <div style={{ fontFamily: SERIF, fontSize: "clamp(24px, 5vw, 48px)", fontWeight: 500 }}>{t.groom}</div>
            </motion.div>

            <motion.div
              whileHover={{ flex: 1.5 }}
              onClick={() => handleTeamSelect('bride')}
              style={{
                flex: 1, background: "linear-gradient(to left, rgba(167, 243, 208, 0.05), transparent)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "flex 0.5s ease"
              }}
            >
              <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: 5, textTransform: "uppercase", color: "rgba(167, 243, 208, 1)", marginBottom: 12 }}>Apoorva's</div>
              <div style={{ fontFamily: SERIF, fontSize: "clamp(24px, 5vw, 48px)", fontWeight: 500 }}>{t.bride}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
