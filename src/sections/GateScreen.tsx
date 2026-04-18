import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SERIF = `"Playfair Display", ui-serif, Georgia, serif`;
const SANS  = "Inter, ui-sans-serif, system-ui, sans-serif";

// ─── Main GateScreen ───────────────────────────────────────────────────────────
interface Props { onComplete: () => void; onSkip?: () => void; }

export default function GateScreen({ onComplete, onSkip }: Props) {
  const [phase, setPhase] = useState<"start"|"ganesh"|"text">("start");
  const done = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ganesh"), 600);
    const t2 = setTimeout(() => setPhase("text"),   3200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onComplete();
  };

  const skip = () => {
    if (done.current) return;
    done.current = true;
    (onSkip ?? onComplete)();
  };

  const atGanesh = phase === "ganesh" || phase === "text";
  const atText   = phase === "text";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, overflow:"hidden", userSelect:"none" }}>

      {/* Background — deep twilight, matches app dark theme */}
      <div style={{
        position:"absolute", inset:0, zIndex:0,
        background:"linear-gradient(to bottom,#0a0510 0%,#1a0a2e 35%,#2d1040 60%,#1a0820 100%)",
      }} />
      {/* Soft centre glow */}
      <div style={{
        position:"absolute", inset:0, zIndex:1, pointerEvents:"none",
        background:"radial-gradient(ellipse 80% 60% at 50% 55%, rgba(180,100,255,0.10) 0%, transparent 70%)",
      }} />

      {/* Golden aura */}
      <motion.div
        initial={{ opacity:0, scale:0.4 }}
        animate={{ opacity:atGanesh?1:0, scale:atGanesh?1.2:0.4 }}
        transition={{ duration:2.8, ease:[0.16,1,0.3,1] }}
        style={{
          position:"absolute", inset:0, zIndex:3,
          display:"flex", alignItems:"center", justifyContent:"center",
          pointerEvents:"none",
        }}
      >
        <div style={{
          width:"min(90vw,580px)", height:"min(90vw,580px)", borderRadius:"50%",
          background:"radial-gradient(circle,rgba(255,248,120,.80) 0%,rgba(255,195,35,.50) 28%,rgba(255,140,0,.16) 56%,transparent 75%)",
          filter:"blur(32px)",
        }} />
      </motion.div>

      {/* Ganesh */}
      <motion.div
        initial={{ opacity:0, scale:0.85 }}
        animate={atGanesh
          ? { opacity:1, scale:1 }
          : { opacity:0, scale:0.85 }
        }
        transition={{ duration:2.8, ease:[0.16,1,0.3,1] }}
        style={{
          position:"absolute", inset:0, zIndex:4,
          display:"flex", alignItems:"center", justifyContent:"center",
          pointerEvents:"none",
        }}
      >
        <img
          src="/assets/ganesh-opt.png"
          alt=""
          style={{
            width:"min(68vw,400px)", objectFit:"contain", display:"block",
            filter:"drop-shadow(0 0 50px rgba(255,210,50,.95)) drop-shadow(0 0 100px rgba(255,130,0,.60))",
          }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      </motion.div>

      {/* Text + CTA */}
      <AnimatePresence>
        {atText && (
          <motion.div
            key="text"
            initial={{ opacity:0, y:32 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0 }}
            transition={{ duration:1.3, ease:[0.16,1,0.3,1] }}
            style={{
              position:"absolute", inset:0, zIndex:20,
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"flex-end",
              paddingBottom:"clamp(40px,10vh,80px)",
              textAlign:"center",
            }}
          >
            <motion.div
              initial={{ opacity:0, y:14 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:1.0, delay:0.1 }}
              style={{
                fontFamily:SERIF, fontStyle:"italic",
                fontSize:"clamp(26px,6.5vw,58px)",
                color:"#fff8ef",
                textShadow:"0 2px 24px rgba(255,180,0,.35),0 1px 4px rgba(0,0,0,.5)",
                letterSpacing:"2px", lineHeight:1.18, marginBottom:8,
              }}
            >
              Niteen &amp; Apoorva
            </motion.div>

            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ duration:1.0, delay:0.35 }}
              style={{
                fontFamily:SANS, fontSize:"clamp(9px,2vw,11px)",
                letterSpacing:"6px", textTransform:"uppercase",
                color:"rgba(255,220,160,.75)",
                textShadow:"none",
                marginBottom:5,
              }}
            >
              Wedding Invitation
            </motion.div>

            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ duration:1.0, delay:0.5 }}
              style={{
                fontFamily:SANS, fontSize:"clamp(9px,2vw,11px)",
                letterSpacing:"5px", textTransform:"uppercase",
                color:"rgba(255,200,120,.60)",
                textShadow:"none",
                marginBottom:32,
              }}
            >
              26 April 2026
            </motion.div>

            <motion.button
              initial={{ opacity:0, scale:0.88 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.8, delay:0.75 }}
              whileTap={{ scale:0.95 }}
              onClick={finish}
              style={{
                fontFamily:SERIF, fontStyle:"italic",
                fontSize:"clamp(14px,3vw,18px)",
                color:"#1a0800",
                background:"linear-gradient(135deg,#ffd700 0%,#ffb300 50%,#ffe066 100%)",
                border:"none", borderRadius:50,
                padding:"14px 44px",
                letterSpacing:"3px", cursor:"pointer",
                boxShadow:"0 4px 28px rgba(255,175,0,.6),0 1px 4px rgba(0,0,0,.2)",
                marginBottom:14,
              }}
            >
              ✦ Enter ✦
            </motion.button>

            <motion.button
              initial={{ opacity:0 }}
              animate={{ opacity:0.62 }}
              transition={{ duration:0.8, delay:1.2 }}
              whileTap={{ scale:0.95 }}
              onClick={skip}
              style={{
                fontFamily:SANS, fontSize:"clamp(10px,2vw,12px)",
                color:"rgba(255,220,160,.55)",
                background:"transparent",
                border:"1px solid rgba(255,200,120,.25)",
                borderRadius:50, padding:"8px 28px",
                letterSpacing:"3px", textTransform:"uppercase", cursor:"pointer",
              }}
            >
              Skip
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
