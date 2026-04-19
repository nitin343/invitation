// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  CINEMATIC SECTION — LOCKED. DO NOT MODIFY TIMELINE OR ANIMATIONS.      ║
// ║  Timeline, p-values, durations and all motion transforms are final.      ║
// ╚══════════════════════════════════════════════════════════════════════════╝

import { useEffect, useMemo, useRef, useState } from "react";
import { Howl } from "howler";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { Language, translations } from "../i18n";
import { getCDNUrl } from "../utils/cdn";


// ─── 30-SECOND CINEMATIC TIMELINE ─────────────────────────────────────────────
// p=0.000–0.033 (0–1s)       BLACK FADE-IN
// p=0.033–0.200 (1–6s)       VIDEO  blur 18→0, scale 1.08→1.02, bright 0.6→0.8
// p=0.200–0.283 (6–8.5s)     FREEZE + EMOTIONAL DIP  bright 0.8→0.1
// p=0.283–0.520 (8.5–15.6s)  RING   blur-in, hold, soft fade
// p=0.433–0.520 (13–15.6s)   ring fades, stars rise
// p=0.480–0.560 (14.4–16.8s) CONNECTION text
// p=0.560–0.727 (16.8–21.8s) COUPLE REVEAL — 5s dramatic suspense
// p=0.727–0.900 (21.8–27s)   NAMES appear (3s) + tagline
// p=0.900–1.000 (27–30s)     HOLD — user reads names

// ─── FONTS ────────────────────────────────────────────────────────────────────
const SERIF =
  '"Cormorant Garamond", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
const SANS =
  '"Montserrat", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial';

const TEXT_PARCHMENT = "#e8dfd0";
const AMBER_FLAME    = "rgba(255,183,77,0.9)";

// Kannada Typography System
const getKannadaStyle = (baseFontSize: string = "16px") => ({
  fontFamily: '"Noto Serif Kannada", serif',
  fontSize: baseFontSize,
  fontWeight: 500,
  letterSpacing: 0,
  lineHeight: 1.5,
  color: "#E8DFD0",
  textAlign: "center" as const,
});

// ─── EASING PRESETS ───────────────────────────────────────────────────────────
const EASE_SOFT_ENTER  = [0.22, 1, 0.36, 1] as [number,number,number,number];
const EASE_GENTLE_EXIT = [0.4,  0, 0.2,  1] as [number,number,number,number];
const EASE_REVEAL      = [0.16, 1, 0.3,  1] as [number,number,number,number];
const EASE_EMOTIONAL   = [0.33, 1, 0.68, 1] as [number,number,number,number];
const EASE_SHARP       = [0.65, 0, 0.35, 1] as [number,number,number,number];

interface Props { onComplete: () => void; lang?: Language; }

// ─── DETERMINISTIC STAR LAYERS ────────────────────────────────────────────────
interface Star { left:string; top:string; size:number; baseOpacity:number; animDelay:string; animDur:string; }
function makeStarLayer(count:number, seed:number): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const s  = Math.sin((i+seed)*127.1)*0.5+0.5;
    const t  = Math.sin((i+seed)*311.7)*0.5+0.5;
    const sz = Math.sin((i+seed)*91.3) *0.5+0.5;
    return {
      left:        `${(s *100).toFixed(2)}%`,
      top:         `${(t *100).toFixed(2)}%`,
      size:        sz < 0.65 ? 1 : 2,
      baseOpacity: 0.3 + sz*0.5,
      animDelay:   `${((Math.sin((i+seed)*53.7)*0.5+0.5)*5).toFixed(2)}s`,
      animDur:     `${(3.5+(Math.sin((i+seed)*19.3)*0.5+0.5)*3).toFixed(2)}s`,
    };
  });
}

export default function CinematicLoveSection({ onComplete, lang = 'en' }: Props) {
  const p        = useMotionValue(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const howlRef    = useRef<Howl | null>(null);
  const [muted, setMuted] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const t = translations[lang];

  const toggleMute = () => {
    setMuted(m => {
      howlRef.current?.mute(!m);
      return !m;
    });
  };

  const startAudio = () => {
    const h = new Howl({
      src: [getCDNUrl('sahilmadan-wedding-invitation-421393.mp3', { isAudio: true })],
      loop: true,
      volume: 0,
      html5: true,          // streaming — starts faster
      onplayerror: () => {
        // Howler's built-in mobile unlock — retry on interaction
        h.once("unlock", () => { h.play(); setAudioBlocked(false); });
        setAudioBlocked(true);
      },
      onplay: () => {
        setAudioBlocked(false);
        // fade in to 0.75 over 2s
        h.fade(0, 0.75, 2000);
      },
    });
    howlRef.current = h;
    h.play();
  };

  const unblockAudio = () => {
    howlRef.current?.play();
    setAudioBlocked(false);
  };

  const stopAudio = () => {
    const h = howlRef.current;
    if (!h) return;
    h.stop();
    h.unload();
    howlRef.current = null;
  };

  // Each layer is mounted only while needed — unmounted (removed from DOM) after its window
  const [showVid,   setShowVid]   = useState(true);   // 0.00 → 0.42 (paused on last frame 0.30–0.42)
  const [showRing,  setShowRing]  = useState(false);  // 0.42 → 0.78
  const [showHero,  setShowHero]  = useState(false);  // 0.84 → end
  const [showSpike, setShowSpike] = useState(false);  // 0.84 → 0.90
  const [shake,     setShake]     = useState(false);  // micro-shake trigger

  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.innerWidth < 768, []
  );

  const { farStars, midStars, nearStars } = useMemo(() => ({
    farStars:  makeStarLayer(isMobile ? 25 : 50,    0),
    midStars:  makeStarLayer(isMobile ? 15 : 30, 1000),
    nearStars: makeStarLayer(isMobile ?  5 : 10, 2000),
  }), [isMobile]);

  // ─── Master timeline ────────────────────────────────────────────────────────
  useEffect(() => {
    startAudio();
    // Stop audio 2s after cinematic ends (30s + 2s buffer = 32s)
    const audioTimer = setTimeout(() => {
      howlRef.current?.stop();
      howlRef.current?.unload();
      howlRef.current = null;
    }, 32000);

    const controls = animate(p, 1, {
      duration: 30,
      ease: "linear",
      onComplete() {
        onComplete();
      },
    });
    return () => {
      controls.stop();
      clearTimeout(audioTimer);
      howlRef.current?.stop();
      howlRef.current?.unload();
      howlRef.current = null;
    };
  }, [p, onComplete]);

  // ─── Side-effects: mount / unmount layers by timeline ─────────────────────
  useEffect(() => {
    return p.on("change", (v) => {
      // VIDEO: pause on last frame at 0.200, unmount at 0.283
      if (v >= 0.200 && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      if (v >= 0.283) setShowVid(false);
      // RING 0.283–0.520
      if (v >= 0.283 && v < 0.520) setShowRing(true);
      if (v >= 0.520)              setShowRing(false);
      // HERO 0.560–end
      if (v >= 0.560) setShowHero(true);
      // BRIGHTNESS SPIKE 0.560–0.627
      if (v >= 0.560 && v < 0.627) setShowSpike(true);
      if (v >= 0.627)              setShowSpike(false);
      // MICRO-SHAKE at 0.560
      if (v >= 0.560 && v <= 0.565 && !shake) {
        setShake(true);
        setTimeout(() => setShake(false), 400);
      }
    });
  }, [p, shake]);

  // ─── PARALLAX stars ─────────────────────────────────────────────────────────
  const yFar  = useTransform(p, [0,1], [0,  -8]);
  const yMid  = useTransform(p, [0,1], [0, -14]);
  const yNear = useTransform(p, [0,1], [0, -20]);
  const yFarPx  = useMotionTemplate`${yFar}px`;
  const yMidPx  = useMotionTemplate`${yMid}px`;
  const yNearPx = useMotionTemplate`${yNear}px`;

  // ─── ATMOSPHERE ─────────────────────────────────────────────────────────────
  // stars brighten during ring + connection window
  const auroraOpacity   = useTransform(p, [0,0.040,0.283,0.347,0.520,0.560,1], [0,0.5,0.5,1.0,1.0,0.6,0.5]);
  const vignetteOpacity = useTransform(p, [0,0.067,0.333,1], [0.55,0.78,0.72,0.95]);

  // ─── z:5  VIDEO — mystery (0.00–0.283) ─────────────────────────────────────
  const vidBlurPx     = useTransform(p, [0.033, 0.100, 0.200], [18, 0, 0]);
  const vidBrightness = useTransform(p, [0, 0.033, 0.067, 0.200, 0.240, 0.283], [0, 0, 0.6, 0.8, 0.4, 0.1]);
  const vidSaturate   = useTransform(p, [0, 0.067, 0.200, 0.283], [1.0, 1.1, 1.0, 0.4]);
  const vidFilter     = useMotionTemplate`blur(${vidBlurPx}px) brightness(${vidBrightness}) saturate(${vidSaturate}) contrast(1.05)`;
  const vidScale      = useTransform(p, [0.033, 0.200], [1.08, 1.02]);
  const vidOpacity    = useTransform(p, [0, 0.033, 0.253, 0.283], [0, 1, 1, 0]);

  // ─── z:7  RING — 8.5–15.6s (0.283–0.520) ────────────────────────────────────
  const ringOpacity = useTransform(p, [0.283, 0.347, 0.433, 0.520], [0, 1, 1, 0]);
  const ringScale   = useTransform(p, [0.283, 0.467], [1.06, 1.0]);
  const ringBlurPx  = useTransform(p, [0.283, 0.347], [20, 0]);
  const ringFilter  = useMotionTemplate`blur(${ringBlurPx}px) contrast(1.08) brightness(0.95) saturate(1.12) hue-rotate(-4deg)`;

  // ─── z:9  COUPLE — 5s dramatic reveal (0.560–0.727) = 16.8–21.8s ─────────────
  // Slow blur clear over 4s for maximum suspense, scale drifts for 5s
  const heroOpacity = useTransform(p, [0.560, 0.693], [0, 1]);
  const heroScale   = useTransform(p, [0.560, 0.727], [1.08, 1.0]);
  const heroBlurPx  = useTransform(p, [0.560, 0.710], [32, 20]);
  const heroFilter  = useMotionTemplate`blur(${heroBlurPx}px) contrast(1.08) brightness(0.97) saturate(1.12) hue-rotate(-4deg)`;
  const revealSpikeOp = useTransform(p, [0.560, 0.577, 0.620], [0, 0.45, 0]);
  const gradeOp       = useTransform(p, [0.560, 0.727], [0, 1]);

  // ─── BEAT 1 — "In every universe…" over video (0.067–0.200) = 2–6s ───────────
  const introOp = useTransform(p, [0.067, 0.100, 0.167, 0.200], [0, 1, 1, 0]);
  const introY  = useTransform(p, [0.067, 0.100, 0.200],        [20, 0, -20]);

  // ─── BEAT 2 — "…the same two souls" over ring (0.347–0.467) = 10.4–14s ────────
  const ring2Op = useTransform(p, [0.347, 0.373, 0.427, 0.467], [0, 1, 1, 0]);
  const ring2Y  = useTransform(p, [0.347, 0.373, 0.467],        [20, 0, -14]);

  // ─── BEAT 3 — "…and they meet again." (0.480–0.560) = 14.4–16.8s ──────────────
  const foundOp = useTransform(p, [0.480, 0.507, 0.533, 0.560], [0, 1, 1, 0]);
  const foundY  = useTransform(p, [0.480, 0.507, 0.560],        [14, 0, -14]);

  // ─── BEAT 4 — Amber rule (0.727–0.793) = 21.8–23.8s ──────────────────────────
  const ruleScaleX = useTransform(p, [0.727, 0.793], [0, 1]);
  const ruleOp     = useTransform(p, [0.727, 0.760], [0, 1]);

  // ─── BEAT 4 — Names (0.727–0.900) = 21.8–27s ────────────────────────────────
  const namesOp    = useTransform(p, [0.727, 0.800], [0, 1]);
  const namesY     = useTransform(p, [0.727, 0.800], [22, 0]);
  const namesSp    = useTransform(p, [0.727, 0.900], [20, 1]);
  const namesSp_px = useMotionTemplate`${namesSp}px`;
  const heartbeat  = useTransform(p, [0.840, 0.870, 0.920], [1, 1.015, 1]);

  // ─── BEAT 5 — Tagline (0.830–0.960) = 24.9–28.8s ────────────────────────────
  const tagOp = useTransform(p, [0.830, 0.900], [0, 1]);
  const tagY  = useTransform(p, [0.830, 0.900], [10, 0]);

  // ─── MOBILE: opacity + scale zoom-settle (Netflix-style, no Y = no jumping) ──
  // scale 1.06→1 on enter, 1→0.96 on exit — cinematic "title card" feel
  const mIntroScale = useTransform(p, [0.067, 0.113, 0.167, 0.200], [1.06, 1.0, 1.0, 0.96]);
  const mRing2Scale = useTransform(p, [0.347, 0.387, 0.433, 0.467], [1.06, 1.0, 1.0, 0.96]);
  const mFoundScale = useTransform(p, [0.480, 0.520, 0.547, 0.560], [1.06, 1.0, 1.0, 0.96]);
  const mNamesScale = useTransform(p, [0.727, 0.800], [1.04, 1.0]);

  // ─── SHARED LAYER HELPERS ────────────────────────────────────────────────────
  const renderStarLayer = (
    stars: Star[],
    ty: ReturnType<typeof useMotionTemplate>
  ) => (
    <motion.div aria-hidden="true" style={{ position:"absolute", inset:0, translateY: ty }}>
      {stars.map((star,i) => (
        <div key={i} className="star-particle" style={{
          position:"absolute", left:star.left, top:star.top,
          width:star.size, height:star.size,
          borderRadius:"50%", background:"#ffffff",
          opacity:star.baseOpacity,
          animationDelay:   star.animDelay,
          animationDuration:star.animDur,
        }} />
      ))}
    </motion.div>
  );

  /** All visual layers (grain, stars, aurora, LUT, vignette, video, ring, couple)
   *  are identical between mobile and desktop — only the text stage differs.  */
  const sharedLayers = (
    <>
      {/* z:0  Film grain */}
      <div className="film-grain" aria-hidden="true" />

      {/* z:1  Stars */}
      <div aria-hidden="true" style={{ position:"absolute", inset:0, zIndex:1 }}>
        {renderStarLayer(farStars,  yFarPx)}
        {renderStarLayer(midStars,  yMidPx)}
        {renderStarLayer(nearStars, yNearPx)}
      </div>

      {/* z:2  Aurora */}
      <motion.div aria-hidden="true" style={{
        position:"absolute", inset:0, zIndex:2,
        opacity: auroraOpacity,
        background:
          "radial-gradient(ellipse 130% 58% at 14% 18%, rgba(147,51,234,0.24) 0%, transparent 64%)," +
          "radial-gradient(ellipse 95%  48% at 86% 26%, rgba(236,72,153,0.18) 0%, transparent 64%)," +
          "radial-gradient(ellipse 80%  44% at 52% 88%, rgba(167,243,208,0.13) 0%, transparent 64%)",
        animation:"aurora 14s ease-in-out infinite",
        pointerEvents:"none",
      }} />

      {/* z:3  Cinematic LUT */}
      <div aria-hidden="true" style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none",
        background:"radial-gradient(circle at 20% 30%, rgba(56,189,248,0.08), transparent 60%)" }} />
      <div aria-hidden="true" style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none",
        background:"radial-gradient(circle at 80% 70%, rgba(255,183,77,0.10), transparent 65%)" }} />
      <div aria-hidden="true" style={{ position:"absolute", inset:0, zIndex:3, pointerEvents:"none",
        background:"radial-gradient(circle at 50% 50%, rgba(236,72,153,0.06), transparent 70%)" }} />

      {/* z:4  Vignette */}
      <motion.div aria-hidden="true" style={{
        position:"absolute", inset:0, zIndex:4,
        opacity: vignetteOpacity,
        background:
          "radial-gradient(ellipse 70% 65% at 50% 46%," +
          "  rgba(5,10,24,0.00) 0%," +
          "  rgba(5,10,24,0.44) 52%," +
          "  rgba(5,10,24,0.97) 100%)",
        pointerEvents:"none",
      }} />

      {/* z:5  Video */}
      {showVid && (
        <motion.video
          ref={videoRef}
          src={getCDNUrl('ring opening.mp4', { isVideo: true })}
          autoPlay muted loop playsInline
          aria-hidden="true"
          style={{
            position:"absolute", inset:0, zIndex:5,
            width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center",
            opacity: vidOpacity, scale: vidScale, filter: vidFilter,
            willChange:"transform, filter, opacity",
          }}
        />
      )}

      {/* z:7  Ring */}
      {showRing && (
        <motion.img
          src={getCDNUrl('couple-ring', { width: 1200 })}
          alt="" draggable={false}
          style={{
            position:"absolute", inset:0, zIndex:7,
            width:"100%", height:"100%",
            objectFit:"cover", objectPosition:"center",
            opacity: ringOpacity, scale: ringScale, filter: ringFilter,
            willChange:"transform, filter, opacity",
          }}
          transition={{ duration:1.8, ease: EASE_EMOTIONAL }}
        />
      )}

      {/* z:9  Couple */}
      {showHero && (
        <motion.div
          className={shake ? "cinema-shake" : undefined}
          style={{ position:"absolute", inset:0, zIndex:9 }}
        >
          <motion.img
            src={getCDNUrl('couple-photo-1', { width: 1200 })}
            alt="" draggable={false}
            style={{
              position:"absolute", inset:0,
              width:"100%", height:"100%",
              objectFit:"cover", objectPosition:"center 25%",
              opacity: heroOpacity, scale: heroScale, filter: heroFilter,
              willChange:"transform, filter, opacity",
            }}
            transition={{ duration:2.2, ease: EASE_EMOTIONAL }}
          />
        </motion.div>
      )}

      {/* z:9  Brightness spike */}
      {showSpike && (
        <motion.div aria-hidden="true" style={{
          position:"absolute", inset:0, zIndex:9,
          opacity: revealSpikeOp,
          background:"rgba(255,240,200,1)",
          mixBlendMode:"screen", pointerEvents:"none",
        }} />
      )}

      {/* z:10  Colour grade */}
      <motion.div aria-hidden="true" style={{
        position:"absolute", inset:0, zIndex:10,
        opacity: gradeOp,
        background:
          "linear-gradient(155deg," +
          "  rgba(5,10,24,0.58) 0%," +
          "  rgba(13,27,62,0.10) 46%," +
          "  rgba(5,10,24,0.68) 100%)",
        pointerEvents:"none",
      }} />
    </>
  );

  // ─── MOBILE RENDER ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <div
          className="cinema-open"
          aria-label="Cinematic introduction"
          style={{ position:"fixed", inset:0, background:"linear-gradient(to bottom,#0a0510 0%,#1a0a2e 35%,#2d1040 60%,#1a0820 100%)", overflow:"hidden" }}
        >
          <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", background:"radial-gradient(ellipse 80% 60% at 50% 55%, rgba(180,100,255,0.10) 0%, transparent 70%)" }} />
          {sharedLayers}

          {/* z:11  Mobile text — flex centered, scale zoom-settle, vw fonts */}
          <div aria-live="polite" style={{
            position:"absolute", inset:0, zIndex:11,
            pointerEvents:"none",
          }}>

            {/* ── centering shell shared by beats 1-3 ── */}
            {/* Each beat: outer div = flex center, inner motion.div = scale+opacity */}

            {/* BEAT 1 */}
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              textAlign:"center", padding:"0 24px",
            }}>
              <motion.div style={{
                opacity: introOp,
                scale: mIntroScale,
                textShadow:"0 4px 40px rgba(5,10,24,1), 0 0 60px rgba(5,10,24,0.9)",
              }}>
                <div style={{
                  fontFamily:SERIF, fontSize:"9vw", fontWeight:400,
                  letterSpacing:"0.5px", lineHeight:1.2, color:TEXT_PARCHMENT,
                }}>
                  {t.cinema1Main}
                </div>
                <div style={{
                  marginTop:14, fontFamily:SANS, fontSize:"3.5vw", fontWeight:500,
                  letterSpacing:"1px", textTransform:"uppercase", color:"#E6D8B5",
                }}>
                  {t.cinema1Sub}
                </div>
              </motion.div>
            </div>

            {/* BEAT 2 */}
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              textAlign:"center", padding:"0 24px",
            }}>
              <motion.div style={{
                opacity: ring2Op,
                scale: mRing2Scale,
                textShadow:"0 4px 40px rgba(5,10,24,1), 0 0 60px rgba(5,10,24,0.9)",
              }}>
                <div style={{
                  fontFamily:SERIF, fontSize:"9vw", fontWeight:400,
                  letterSpacing:"0.5px", lineHeight:1.2, color:TEXT_PARCHMENT,
                }}>
                  {t.cinema2Main}
                </div>
                <div style={{
                  marginTop:14, fontFamily:SANS, fontSize:"3.5vw", fontWeight:500,
                  letterSpacing:"1px", textTransform:"uppercase", color:"#f472b6",
                }}>
                  {t.cinema2Sub}
                </div>
              </motion.div>
            </div>

            {/* BEAT 3 */}
            <div style={{
              position:"absolute", inset:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              textAlign:"center", padding:"0 24px",
            }}>
              <motion.div style={{
                opacity: foundOp,
                scale: mFoundScale,
                textShadow:"0 4px 40px rgba(5,10,24,1), 0 0 60px rgba(5,10,24,0.9)",
              }}>
                <div style={{
                  fontFamily:SERIF, fontSize:"9vw", fontWeight:400,
                  letterSpacing:"0.5px", lineHeight:1.2, color:TEXT_PARCHMENT,
                }}>
                  {t.cinema3Main}
                </div>
                <div style={{
                  marginTop:14, fontFamily:SANS, fontSize:"3.5vw", fontWeight:500,
                  letterSpacing:"1px", textTransform:"uppercase", color:"#E6D8B5",
                }}>
                  {t.cinema3Sub}
                </div>
              </motion.div>
            </div>

            {/* BEAT 4-5: Names + Tagline — anchored bottom */}
            <div style={{
              position:"absolute", left:0, right:0, bottom:"9%",
              display:"flex", justifyContent:"center",
              textAlign:"center", padding:"0 24px",
            }}>
              <motion.div style={{
                opacity: namesOp,
                scale: mNamesScale,
                textShadow:"0 4px 40px rgba(5,10,24,1), 0 0 100px rgba(5,10,24,0.98)",
              }}>
                {/* Amber rule */}
                <motion.div style={{
                  width:52, height:1, margin:"0 auto 18px",
                  background:"linear-gradient(90deg, transparent, rgba(255,183,77,0.9), transparent)",
                  scaleX:ruleScaleX, opacity:ruleOp, transformOrigin:"center",
                }} />
                {/* Names */}
                <motion.div className="names-chromatic" style={{
                  fontFamily:SERIF, fontSize:"clamp(48px, 12vw, 120px)", fontWeight:500,
                  letterSpacing:namesSp_px, lineHeight:1.1,
                  color:TEXT_PARCHMENT, scale:heartbeat,
                }}>
                  {t.brideName}{" "}
                  <span style={{ fontSize:"0.55em", verticalAlign:"middle", color:AMBER_FLAME }}>✦</span>{" "}
                  {t.groomName}
                </motion.div>
                {/* Tagline */}
                <motion.div style={{
                  marginTop:16, fontFamily:SANS, fontSize:"clamp(18px, 4vw, 64px)", fontWeight:500,
                  letterSpacing:"1px", textTransform:"uppercase", color:"#ffb74d",
                  opacity:tagOp,
                }}>
                  {t.tagline}
                </motion.div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Mobile controls */}
        <div style={{ position:"fixed", top:16, right:20, zIndex:100, display:"flex", gap:16, alignItems:"center" }}>
          <button
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            style={{
              fontFamily:SANS, fontSize:16, lineHeight:1,
              color: muted ? "rgba(232,223,208,0.25)" : "rgba(232,223,208,0.55)",
              background:"transparent", border:"none", cursor:"pointer",
              padding:"8px 4px", WebkitTapHighlightColor:"transparent",
              transition:"color 0.3s",
            }}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button
            onClick={onComplete}
            style={{
              fontFamily:SANS, fontSize:12, fontWeight:400,
              letterSpacing:"1px", textTransform:"uppercase",
              color:"rgba(232,223,208,0.45)", background:"transparent",
              border:"none", cursor:"pointer", padding:"8px 4px",
              WebkitTapHighlightColor:"transparent",
            }}
          >
            Skip ›
          </button>
        </div>
      </>
    );
  }

  // ─── DESKTOP RENDER ─────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Autoplay blocked nudge ── */}
      {audioBlocked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          onClick={unblockAudio}
          style={{
            position: "fixed", bottom: 24, left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999, cursor: "pointer",
            background: "rgba(5,10,24,0.80)",
            border: "1px solid rgba(255,183,77,0.25)",
            borderRadius: 40,
            padding: "8px 20px",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <span style={{ fontSize: 14 }}>🔇</span>
          <span style={{
            fontFamily: '"Montserrat", sans-serif',
            fontSize: 10, letterSpacing: "2px",
            textTransform: "uppercase",
            color: "rgba(255,183,77,0.80)",
          }}>tap to unmute</span>
        </motion.div>
      )}
      <div
        className="cinema-open"
        aria-label="Cinematic introduction"
          style={{ position:"fixed", inset:0, background:"linear-gradient(to bottom,#0a0510 0%,#1a0a2e 35%,#2d1040 60%,#1a0820 100%)", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", background:"radial-gradient(ellipse 80% 60% at 50% 55%, rgba(180,100,255,0.10) 0%, transparent 70%)" }} />
        {sharedLayers}

        {/* z:11  Desktop text stage */}
        <div aria-live="polite" style={{
          position:"absolute", inset:0, zIndex:11,
          pointerEvents:"none",
          display:"flex", justifyContent:"center", alignItems:"flex-end",
          paddingBottom:"11vh", paddingLeft:28, paddingRight:28,
        }}>
          <div style={{
            position:"relative", width:"100%", maxWidth:600, height:185,
            textAlign:"center", lineHeight:1.25, color: TEXT_PARCHMENT,
          }}>

            {/* BEAT 1 */}
            <motion.div style={{
              opacity:introOp, y:introY,
              position:"absolute", left:0, right:0, bottom:0,
              textShadow:"0 2px 22px rgba(5,10,24,1), 0 0 100px rgba(5,10,24,0.9)",
            }} transition={{ opacity:{ease:EASE_SOFT_ENTER}, y:{ease:EASE_GENTLE_EXIT} }}>
              <div style={{ fontFamily:SERIF, fontSize:"clamp(28px,4.5vw,56px)", fontWeight:400, letterSpacing:"1px", lineHeight:1.15, whiteSpace:"nowrap" }}>
                {t.cinema1Main}
              </div>
              <div style={{ marginTop:14, fontFamily:SANS, fontSize:"clamp(11px,1.4vw,15px)", fontWeight:400, letterSpacing:"1px", textTransform:"uppercase", color:"rgba(167,243,208,1)", whiteSpace:"nowrap" }}>
                {t.cinema1Sub}
              </div>
            </motion.div>

            {/* BEAT 2 */}
            <motion.div style={{
              opacity:ring2Op, y:ring2Y,
              position:"absolute", left:0, right:0, bottom:0,
              textShadow:"0 2px 22px rgba(5,10,24,1), 0 0 100px rgba(5,10,24,0.9)",
            }} transition={{ opacity:{ease:EASE_SOFT_ENTER}, y:{ease:EASE_GENTLE_EXIT} }}>
              <div style={{ fontFamily:SERIF, fontSize:"clamp(28px,4.5vw,56px)", fontWeight:400, letterSpacing:"2px", lineHeight:1.15, whiteSpace:"nowrap" }}>
                {t.cinema2Main}
              </div>
              <div style={{ marginTop:14, fontFamily:SANS, fontSize:"clamp(11px,1.4vw,15px)", fontWeight:400, letterSpacing:"1px", textTransform:"uppercase", color:"rgba(236,72,153,1)", whiteSpace:"nowrap" }}>
                {t.cinema2Sub}
              </div>
            </motion.div>

            {/* BEAT 3 */}
            <motion.div style={{
              opacity:foundOp, y:foundY,
              position:"absolute", left:0, right:0, bottom:0,
              textShadow:"0 2px 22px rgba(5,10,24,1), 0 0 100px rgba(5,10,24,0.9)",
            }} transition={{ opacity:{ease:EASE_SOFT_ENTER}, y:{ease:EASE_GENTLE_EXIT} }}>
              <div style={{ fontFamily:SERIF, fontSize:"clamp(28px,4.5vw,56px)", fontWeight:400, letterSpacing:"1px", lineHeight:1.15, whiteSpace:"nowrap" }}>
                {t.cinema3Main}
              </div>
              <div style={{ marginTop:14, fontFamily:SANS, fontSize:"clamp(11px,1.4vw,15px)", fontWeight:400, letterSpacing:"1px", textTransform:"uppercase", color:"rgba(167,243,208,1)", whiteSpace:"nowrap" }}>
                {t.cinema3Sub}
              </div>
            </motion.div>

            {/* BEATS 4–5: Names + Tagline */}
            <motion.div style={{
              opacity:namesOp, y:namesY,
              position:"absolute", left:0, right:0, bottom:0,
              textShadow:"0 2px 30px rgba(5,10,24,1), 0 0 150px rgba(5,10,24,0.96)",
            }} transition={{ ease:EASE_REVEAL }}>

              {/* Amber rule */}
              <motion.div style={{
                width:56, height:1, margin:"0 auto 20px",
                background:"linear-gradient(90deg, transparent, rgba(255,183,77,0.9), transparent)",
                scaleX:ruleScaleX, opacity:ruleOp, transformOrigin:"center",
              }} transition={{ duration:0.8, ease:EASE_SHARP }} />

              {/* Names */}
              <motion.div className="names-chromatic" style={{
                fontFamily:SERIF, fontSize:"clamp(42px, 8vw, 90px)", fontWeight:500,
                letterSpacing:namesSp_px, lineHeight:1.05,
                whiteSpace:"nowrap", color:TEXT_PARCHMENT,
                scale:heartbeat,
              }} transition={{ ease:EASE_EMOTIONAL }}>
                {t.brideName}{" "}
                <span style={{ fontSize:"0.62em", verticalAlign:"middle", color:AMBER_FLAME }}>✦</span>{" "}
                {t.groomName}
              </motion.div>

              {/* Tagline */}
              <motion.div style={{
                marginTop:22, fontFamily:SANS, fontSize:"clamp(14px, 2vw, 20px)", fontWeight:400,
                letterSpacing:"2px", textTransform:"uppercase",
                color:"rgba(255,183,77,1)",
                opacity:tagOp, y:tagY, whiteSpace:"nowrap",
              }} transition={{ ease:EASE_SOFT_ENTER }}>
                {t.tagline}
              </motion.div>
            </motion.div>

          </div>
        </div>
      </div>

      {/* Desktop controls */}
      <div style={{ position:"fixed", top:20, right:24, zIndex:100, display:"flex", gap:20, alignItems:"center" }}>
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          style={{
            fontSize:15, lineHeight:1,
            color: muted ? "rgba(232,223,208,0.25)" : "rgba(232,223,208,0.55)",
            background:"transparent", border:"none", cursor:"pointer",
            padding:"6px 0", transition:"color 0.3s",
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
        <button
          onClick={onComplete}
          style={{
            fontFamily:SANS, fontSize:11, fontWeight:400,
            letterSpacing:"1px", textTransform:"uppercase",
            color:"rgba(232,223,208,0.40)", background:"transparent",
            border:"none", cursor:"pointer", padding:"6px 0",
            transition:"color 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,183,77,0.9)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(232,223,208,0.40)")}
        >
          Skip ›
        </button>
      </div>
    </>
  );
}
