import { useEffect, useRef, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Clouds, Cloud } from "@react-three/drei";
import * as THREE from "three";

const SERIF = `"Playfair Display", ui-serif, Georgia, serif`;
const SANS  = "Inter, ui-sans-serif, system-ui, sans-serif";

// ─── 3D Cloud Scene ────────────────────────────────────────────────────────────
function CloudScene({ phase }: { phase: string }) {
  const c1 = useRef<THREE.Group>(null);
  const c2 = useRef<THREE.Group>(null);
  const c3 = useRef<THREE.Group>(null);
  const ambRef  = useRef<THREE.AmbientLight>(null);

  const phaseRef = useRef(phase);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  useFrame((_, delta) => {
    const p    = phaseRef.current;
    const lerp = 1 - Math.pow(0.012, delta);
    const t    = Date.now();

    // Clouds start off-screen (left / right / above), gather into upper sky
    const targetC1: [number,number,number] = p === "clouds" ? [-22, 4, -1] : [-5, 4.5, -1];
    const targetC2: [number,number,number] = p === "clouds" ? [22,  4, -1] : [ 5, 4.5, -1];
    const targetC3: [number,number,number] = p === "clouds" ? [0,  22, -1] : [ 0, 5.5, -2];

    if (c1.current) {
      c1.current.position.x += (targetC1[0] - c1.current.position.x) * lerp;
      c1.current.position.y += (targetC1[1] - c1.current.position.y) * lerp
        + Math.sin(t * 0.0008) * 0.003;
      c1.current.position.z += (targetC1[2] - c1.current.position.z) * lerp;
    }
    if (c2.current) {
      c2.current.position.x += (targetC2[0] - c2.current.position.x) * lerp;
      c2.current.position.y += (targetC2[1] - c2.current.position.y) * lerp
        + Math.sin(t * 0.0009 + 1) * 0.003;
      c2.current.position.z += (targetC2[2] - c2.current.position.z) * lerp;
    }
    if (c3.current) {
      c3.current.position.x += (targetC3[0] - c3.current.position.x) * lerp;
      c3.current.position.y += (targetC3[1] - c3.current.position.y) * lerp
        + Math.sin(t * 0.0007 + 2) * 0.003;
      c3.current.position.z += (targetC3[2] - c3.current.position.z) * lerp;
    }

    if (ambRef.current) {
      // Keep lighting neutral/white — no warm yellow shift
      ambRef.current.intensity += (1.2 - ambRef.current.intensity) * 0.03;
    }
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={1.2} color="#ffffff" />
      <directionalLight position={[0, 5, 8]} intensity={1.4} color="#e8f0ff" />

      <Clouds>
        {/* c1 starts far left, gathers upper-left */}
        <group ref={c1} position={[-22, 4, -1]}>
          <Cloud opacity={0.85} speed={0.20} bounds={[12, 2.5, 2]} volume={8} segments={28} color="#ffffff" />
        </group>
        {/* c2 starts far right, gathers upper-right */}
        <group ref={c2} position={[22, 4, -1]}>
          <Cloud opacity={0.80} speed={0.16} bounds={[11, 2.5, 2]} volume={7} segments={26} color="#eef4ff" />
        </group>
        {/* c3 starts above, descends to top-center */}
        <group ref={c3} position={[0, 22, -2]}>
          <Cloud opacity={0.75} speed={0.14} bounds={[14, 2.5, 2]} volume={9} segments={30} color="#f4f8ff" />
        </group>
      </Clouds>
    </>
  );
}

// ─── Main GateScreen ───────────────────────────────────────────────────────────
interface Props { onComplete: () => void; onSkip?: () => void; }

export default function GateScreen({ onComplete, onSkip }: Props) {
  const [phase, setPhase] = useState<"clouds"|"sun"|"ganesh"|"text">("clouds");
  const done = useRef(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("sun"),    1400);
    const t2 = setTimeout(() => setPhase("ganesh"), 2600);
    const t3 = setTimeout(() => setPhase("text"),   5800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
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

  const atSun    = phase === "sun" || phase === "ganesh" || phase === "text";
  const atGanesh = phase === "ganesh" || phase === "text";
  const atText   = phase === "text";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, overflow:"hidden", userSelect:"none" }}>

      {/* Sky — pure daylight blue-white, no yellow */}
      <div
        style={{
          position:"absolute", inset:0, zIndex:0,
          background:"linear-gradient(to bottom,#6ab0d8 0%,#9fcde8 25%,#c8e5f5 55%,#e8f4fb 80%,#f5faff 100%)",
        }}
      />



      {/* 3D Cloud Canvas — sits in upper ~60% of screen */}
      <div style={{ position:"absolute", inset:0, zIndex:2 }}>
        <Canvas
          camera={{ position:[0, 3, 14], fov:60 }}
          gl={{ antialias:true, alpha:true }}
          style={{ background:"transparent" }}
        >
          <Suspense fallback={null}>
            <CloudScene phase={phase} />
          </Suspense>
        </Canvas>
      </div>

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
          src="/assets/ganesh.png"
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
                color:"#2a1800",
                textShadow:"0 2px 16px rgba(0,0,0,.18),0 1px 4px rgba(0,0,0,.12)",
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
                color:"rgba(60,20,0,.80)",
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
                color:"rgba(80,40,0,.70)",
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
                color:"#3a1200",
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
                color:"rgba(60,30,0,.65)",
                background:"transparent",
                border:"1px solid rgba(80,50,0,.25)",
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
