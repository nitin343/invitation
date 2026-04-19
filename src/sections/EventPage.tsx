import { useState, useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useRSVP } from "../hooks/useRSVP";

const SERIF = '"Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif';
const SANS = "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
const PARCHMENT = "#e8dfd0";
const AMBER = "rgba(255,183,77,0.9)";
const INK = "#050a18";

const Rule = () => (
  <div style={{
    width: 64, height: 1, margin: "0 auto",
    background: "linear-gradient(90deg,transparent,rgba(255,183,77,0.75),transparent)",
  }} />
);

const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 0px rgba(255,183,77,0)",
      "0 0 12px rgba(255,183,77,0.3)",
      "0 0 0px rgba(255,183,77,0)"
    ],
    transition: { duration: 2, repeat: Infinity }
  }
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontFamily: SANS, fontSize: 9, letterSpacing: "7px",
    textTransform: "uppercase" as const, color: "rgba(167,243,208,0.65)",
    marginBottom: 12,
  }}>{children}</div>
);

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};
const fadeSlide = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] as const } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1.1, ease: "easeOut" as const } },
};

function SnapSection({ children, bg = INK, style }: {
  children: React.ReactNode; bg?: string; style?: React.CSSProperties;
}) {
  return (
    <section style={{
      height: "100svh", scrollSnapAlign: "start", scrollSnapStop: "always",
      position: "relative", overflow: "hidden", background: bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      ...style,
    }}>{children}</section>
  );
}

function ParallaxBg({ src, scrollRef, filter }: {
  src: string; scrollRef: React.RefObject<HTMLDivElement | null>; filter?: string;
}) {
  const { scrollYProgress } = useScroll({
    container: scrollRef, offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  return (
    <motion.img src={src} alt="" style={{
      position: "absolute", inset: "-12% 0",
      width: "100%", height: "124%",
      objectFit: "cover", objectPosition: "center 20%",
      y, zIndex: 0,
      filter,
    }} />
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: SANS, fontSize: 14, color: PARCHMENT,
  background: "rgba(13,27,62,0.55)",
  border: "1px solid rgba(255,183,77,0.14)",
  borderRadius: 2, padding: "11px 14px", outline: "none",
  width: "100%", boxSizing: "border-box", transition: "border-color 0.2s",
};
const toggleBase: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, letterSpacing: "3px",
  textTransform: "uppercase", border: "1px solid",
  borderRadius: 2, padding: "9px 16px", cursor: "pointer",
  transition: "all 0.2s", background: "transparent",
};

interface EventPageProps { lang?: string; team?: string; }
export default function EventPage({ lang, team }: EventPageProps = {}) {
  const { submitRSVP, isSubmitting } = useRSVP();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    attending: "yes" as "yes" | "no",
    meal: "veg" as "veg" | "nonveg" | "vegan",
    guests: 1,
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [isGeneratingWish, setIsGeneratingWish] = useState(false);

  const generateAIWish = async () => {
    if (!form.name || isGeneratingWish) return;
    setIsGeneratingWish(true);
    try {
      const res = await fetch("http://localhost:5000/api/ai/generate-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: form.name }),
      });
      const data = await res.json();
      if (data.wish) {
        setForm(f => ({ ...f, message: data.wish.replace(/"/g, '') }));
      }
    } catch (err) {
      console.error("Wish generation failed");
    } finally {
      setIsGeneratingWish(false);
    }
  };

  useLayoutEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", checkMobile);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Celebrations — cinematic identity cards (mood + date only)
  const events: { num: string; label: string; sub: string; date: string; day: string; accent: string; glow: string; img: string; imgH: string; imgPos: string; titleTop: boolean; cardPad: string | undefined; mapsUrl: string }[] = [
    { num: "01", label: "Haldi", sub: "A turmeric blessing ceremony", date: "23 April", day: "Thursday", accent: "rgba(251,191,36,0.65)", glow: "rgba(251,191,36,0.12)", img: "/assets/haldi.jfif", imgH: "clamp(170px,28vh,240px)", imgPos: "center", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bidar" },
    { num: "02", label: "Reception", sub: "An evening of light & celebration", date: "25 April", day: "Saturday", accent: "rgba(167,243,208,0.60)", glow: "rgba(167,243,208,0.10)", img: "/assets/reception.jfif", imgH: "clamp(170px,28vh,240px)", imgPos: "top", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=GMA+Kalyan+Mantapa+Bidar" },
    { num: "03", label: "The Wedding", sub: "Sacred vows & eternal union", date: "26 April", day: "Sunday", accent: "rgba(232,121,249,0.60)", glow: "rgba(232,121,249,0.10)", img: "/assets/marriage.jfif", imgH: "clamp(170px,28vh,240px)", imgPos: "top", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=GMA+Kalyan+Mantapa+Bidar" },
    { num: "04", label: "Bidar Reception", sub: "Celebrating with family in Bidar", date: "28 April", day: "Tuesday", accent: "rgba(251,191,36,0.55)", glow: "rgba(251,191,36,0.10)", img: "/assets/bidar-reception.jfif", imgH: "clamp(170px,28vh,240px)", imgPos: "center", titleTop: true, cardPad: "3px", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sri+Function+Hall+Bidar" },
  ];

  // Schedule — practical logistics: where, when, dress
  const schedule = [
    { date: "23 Apr", day: "Thursday", event: "Haldi Ceremony", venue: "Bidar", time: "Morning", dress: "Casual traditional", note: "Yellow & green attire welcome", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bidar" },
    { date: "25 Apr", day: "Saturday", event: "Reception Night", venue: "GMA Kalyan Mantapa", time: "6:00 PM", dress: "Formal / ethnic wear", note: "Ganj, Bidar", mapsUrl: "https://www.google.com/maps/search/?api=1&query=GMA+Kalyan+Mantapa+Bidar" },
    { date: "26 Apr", day: "Sunday", event: "Wedding Ceremony", venue: "GMA Kalyan Mantapa", time: "Morning", dress: "Traditional attire", note: "Ganj, Bidar", mapsUrl: "https://www.google.com/maps/search/?api=1&query=GMA+Kalyan+Mantapa+Bidar" },
    { date: "28 Apr", day: "Tuesday", event: "Reception — Bidar", venue: "Shree Function Hall", time: "Evening", dress: "Formal / ethnic wear", note: "Bidar", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sri+Function+Hall+Bidar" },
  ];

  return (
    <div
      ref={scrollRef}
      style={{
        height: "100svh", overflowY: "scroll",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
        position: "fixed", inset: 0, zIndex: 100,
      }}
    >
      {/* HERO */}
      <SnapSection bg={INK}>
        <ParallaxBg
          src="/assets/couple-photo-1-opt.jpg"
          scrollRef={scrollRef}
          filter="blur(26px) brightness(0.62) saturate(0.75) contrast(1.1)"
        />
        <div style={{
          position: "absolute", inset: 0, zIndex: 1,
          background: "radial-gradient(circle at center, rgba(5,10,24,0.3) 0%, rgba(5,10,24,0.85) 100%), linear-gradient(to bottom,rgba(5,10,24,0.40) 0%,rgba(5,10,24,0.05) 35%,rgba(5,10,24,0.15) 55%,rgba(5,10,24,0.96) 100%)"
        }} />
        <motion.div
          variants={staggerParent} initial="hidden" animate="show"
          style={{
            position: "relative", zIndex: 2,
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", padding: "0 24px", transform: "translateY(8vh)",
          }}
        >
          <motion.div variants={fadeIn} style={{
            fontFamily: SANS, fontSize: "clamp(9px,2.8vw,13px)", letterSpacing: "6px",
            textTransform: "uppercase" as const, color: "#d4f5e9", marginBottom: 22,
            textShadow: "0 2px 18px rgba(0,0,0,0.9)",
          }}>You are cordially invited</motion.div>
          <motion.div variants={fadeSlide} style={{
            fontFamily: SERIF, fontSize: "clamp(44px,13vw,100px)", fontWeight: 500,
            color: "#fff8ef", lineHeight: 1, marginBottom: 16,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "clamp(4px,1.5vw,12px)",
            textShadow: "0 2px 8px rgba(0,0,0,0.95),0 8px 40px rgba(0,0,0,0.85)",
          }}>
            <span>Niteen</span>
            <span style={{ fontStyle: "italic", fontWeight: 400, fontSize: "0.48em", color: "rgba(255,214,150,0.90)" }}>&amp;</span>
            <span>Apoorva</span>
          </motion.div>
          <motion.div variants={fadeIn} style={{
            fontFamily: SERIF, fontSize: "clamp(12px,3.5vw,18px)",
            fontStyle: "italic", color: "rgba(232,223,208,0.60)", marginBottom: 22,
          }}>Together with their families</motion.div>
          <motion.div variants={fadeIn}><Rule /></motion.div>
          <motion.div variants={fadeIn} style={{
            marginTop: 18, fontFamily: SANS, fontSize: "clamp(10px,2.8vw,13px)",
            letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(255,183,77,0.88)",
          }}>26 April 2026</motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 2.8 }}
          style={{
            position: "absolute", bottom: 22, left: 0, right: 0, textAlign: "center", zIndex: 2,
            fontFamily: SANS, fontSize: 8, letterSpacing: "5px",
            textTransform: "uppercase" as const, color: "rgba(232,223,208,0.5)",
          }}
        >swipe</motion.div>
      </SnapSection>

      {/* VERSE */}
      <SnapSection bg="radial-gradient(ellipse 120% 90% at 50% 60%,#0d1b3e 0%,#050a18 70%)">
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.6, once: true }}
          style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 clamp(24px,8vw,80px)" }}
        >
          <motion.div variants={fadeIn}><Eyebrow>A Beginning</Eyebrow><Rule /></motion.div>
          <motion.div variants={fadeSlide} style={{
            fontFamily: SERIF, fontStyle: "italic",
            fontSize: "clamp(20px,5.5vw,38px)", color: "rgba(232,223,208,0.88)",
            lineHeight: 1.75, maxWidth: 520, margin: "28px auto 0",
          }}>
            "Two hearts, one journey —<br />beginning their forever together."
          </motion.div>
          <motion.div variants={fadeIn} style={{
            marginTop: 32, fontFamily: SANS, fontSize: 9, letterSpacing: "5px",
            textTransform: "uppercase" as const, color: "rgba(255,183,77,0.40)",
          }}>Niteen &amp; Apoorva · 26 April 2026</motion.div>
        </motion.div>
      </SnapSection>

      {/* CELEBRATIONS */}
      <SnapSection style={{ justifyContent: "flex-start", padding: "0" }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "radial-gradient(ellipse 130% 58% at 14% 18%,rgba(147,51,234,0.10) 0%,transparent 64%)," +
            "radial-gradient(ellipse 95% 48% at 86% 26%,rgba(236,72,153,0.08) 0%,transparent 64%)," +
            "radial-gradient(ellipse 80% 44% at 52% 88%,rgba(167,243,208,0.06) 0%,transparent 64%)",
        }} />
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.25, once: true }}
          style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: isMobile ? 860 : 1200,
            height: "100svh",
            padding: isMobile ? "clamp(16px,3vh,32px) clamp(16px,4vw,32px)" : "clamp(24px,4vh,48px) clamp(24px,4vw,48px)",
            boxSizing: "border-box",
            display: "flex", flexDirection: "column",
          }}
        >
          <motion.div variants={fadeIn} style={{ textAlign: "center", marginBottom: "clamp(10px,2vh,18px)", flexShrink: 0 }}>
            <Eyebrow>The Celebrations</Eyebrow><Rule />
          </motion.div>

          {/* 2×2 cinematic cards — name + mood + date only, fills remaining height */}
          <div style={{
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: isMobile ? undefined : "repeat(2, 1fr)",
            gridTemplateRows: isMobile ? undefined : "repeat(2, 1fr)",
            flexDirection: isMobile ? "row" : undefined,
            overflowX: isMobile ? "auto" : "visible",
            scrollSnapType: isMobile ? "x mandatory" : "none",
            gap: isMobile ? "20px" : "clamp(16px,2vw,24px)",
            padding: isMobile ? "10px 20px 30px" : "0",
            margin: isMobile ? "0 -20px" : "0",
            flex: 1,
            minHeight: 0,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}>
            {events.map(({ num, label, sub, date, day, accent, glow, img, imgH, imgPos, titleTop, cardPad, mapsUrl }) => (
              <motion.div key={label} variants={fadeSlide}
                whileHover={isMobile ? undefined : { scale: 1.015, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
                style={{
                  position: "relative",
                  background: "linear-gradient(145deg,rgba(8,16,40,0.95) 0%,rgba(4,8,22,0.98) 100%)",
                  border: `1px solid ${accent.replace(/[\d.]+\)$/, "0.22)")}`,
                  borderRadius: 16,
                  padding: isMobile ? "24px" : "18px",
                  backdropFilter: "blur(14px)",
                  transition: "transform 0.4s,box-shadow 0.4s",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "stretch",
                  flex: isMobile ? "0 0 82vw" : "1",
                  minHeight: isMobile ? undefined : "clamp(180px, 32vh, 260px)",
                  scrollSnapAlign: isMobile ? "center" : "none",
                  boxShadow: isMobile ? "0 10px 30px rgba(0,0,0,0.4)" : "none",
                  gap: isMobile ? 0 : 22,
                }}
              >
                {/* ambient glow */}
                <div style={{ position: "absolute", inset: 0, background: glow, pointerEvents: "none", borderRadius: 16 }} />

                {/* center image */}
                <div style={{
                  position: "relative", zIndex: 1,
                  flex: isMobile ? "none" : "0 0 44%",
                  height: isMobile ? "280px" : "auto",
                  minHeight: isMobile ? undefined : "160px",
                  borderRadius: 12, overflow: "hidden",
                  border: `1px solid ${accent.replace(/[\d.]+\)$/, "0.14)")}`,
                }}>
                  <img src={img} alt={label} style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", objectPosition: imgPos,
                    display: "block",
                    filter: "brightness(0.85) saturate(1.1) contrast(1.05)",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: `linear-gradient(to top, ${accent.replace(/[\d.]+\)$/, "0.45)")} 0%, transparent 60%)`,
                  }} />
                </div>

                {/* content column */}
                <div style={{
                  position: "relative", zIndex: 1,
                  flex: 1, display: "flex", flexDirection: "column",
                  justifyContent: "center",
                  padding: isMobile ? "20px 0 0" : "4px 0",
                }}>
                  {/* top row: number + name */}
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: isMobile ? "14px" : "10px" }}>
                    <span style={{
                      fontFamily: SANS, fontSize: isMobile ? "10px" : "clamp(8px,1.2vw,9px)",
                      letterSpacing: "4px", color: accent.replace(/[\d.]+\)$/, "0.55)"),
                      textTransform: "uppercase" as const, flexShrink: 0,
                    }}>{num}</span>
                    <span style={{
                      fontFamily: SERIF, fontStyle: "italic",
                      fontSize: isMobile ? "32px" : "clamp(22px,3vw,28px)",
                      color: "#fff8ef", lineHeight: 1.1,
                    }}>{label}</span>
                  </div>

                  {/* subtitle */}
                  {sub && <div style={{
                    fontFamily: SANS, fontSize: isMobile ? "14px" : "clamp(11px,1.4vw,13px)",
                    color: "rgba(232,223,208,0.75)", fontStyle: "italic",
                    lineHeight: 1.5,
                    marginBottom: isMobile ? "18px" : "14px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                    overflow: "hidden",
                  }}>{sub}</div>}

                  {/* date pill — bottom */}
                  <div style={{ marginTop: "auto" }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "6px 16px", borderRadius: 50,
                      border: `1px solid ${accent.replace(/[\d.]+\)$/, "0.40)")}`,
                      background: accent.replace(/[\d.]+\)$/, "0.15)"),
                    }}>
                      <span style={{ fontFamily: SERIF, fontSize: isMobile ? "16px" : "clamp(13px,1.8vw,15px)", color: accent.replace(/[\d.]+\)$/, "0.95)"), fontWeight: 600 }}>{date}</span>
                      <span style={{ fontFamily: SANS, fontSize: isMobile ? "9px" : "clamp(8px,1.2vw,10px)", letterSpacing: "2px", color: accent.replace(/[\d.]+\)$/, "0.75)"), textTransform: "uppercase" as const }}>{day}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* scroll indicator for mobile */}
          {isMobile && (
            <motion.div variants={fadeIn} style={{
              display: "flex", justifyContent: "center", gap: 8, marginTop: 12, marginBottom: 10
            }}>
              {events.map((_, i) => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: i === 0 ? AMBER : "rgba(255,255,255,0.2)",
                  transition: "all 0.3s"
                }} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </SnapSection>

      {/* SCHEDULE — practical details: venue, time, dress code */}
      <SnapSection bg="radial-gradient(ellipse 100% 80% at 50% 50%,#0a1630 0%,#050a18 80%)">
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.3, once: true }}
          style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: 580,
            padding: "0 clamp(20px,5vw,44px)", boxSizing: "border-box",
          }}
        >
          <motion.div variants={fadeIn} style={{ textAlign: "center", marginBottom: "clamp(20px,3vh,32px)" }}>
            <Eyebrow>Where & When</Eyebrow><Rule />
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {[
              {
                venue: "Gunj Kalyan Mantapa",
                note: "Ganj, Bidar",
                mapsUrl: "https://maps.app.goo.gl/ggPnu7ZgtpsJsv1m6",
                events: [
                  { date: "25 Apr", day: "Sat", name: "Reception Night", time: "6:00 PM", dress: "Formal / Ethnic" },
                  { date: "26 Apr", day: "Sun", name: "Wedding Ceremony", time: "Morning", dress: "Traditional" },
                ]
              },
              {
                venue: "Shree Function Hall",
                note: "Bidar",
                mapsUrl: "https://www.google.com/maps/search/?api=1&query=Sri+Function+Hall+Bidar",
                events: [
                  { date: "28 Apr", day: "Tue", name: "Reception — Bidar", time: "Evening", dress: "Formal / Ethnic" }
                ]
              },
              {
                venue: "Bidar",
                note: "Haldi Venue",
                mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bidar",
                events: [
                  { date: "23 Apr", day: "Thu", name: "Haldi Ceremony", time: "Morning", dress: "Casual Traditional" }
                ]
              }
            ].map((v, i) => (
              <motion.div key={i} variants={fadeSlide} style={{
                background: "rgba(255,255,255,0.02)", borderRadius: 20, padding: 24,
                border: "1px solid rgba(255,183,77,0.1)", position: "relative"
              }}>
                {/* Venue Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: 3, color: "rgba(167,243,208,0.5)", textTransform: "uppercase" }}>Venue</div>
                    <div style={{ fontFamily: SERIF, fontSize: 18, color: PARCHMENT, fontWeight: 600, marginTop: 4 }}>{v.venue}</div>
                    <div style={{ fontFamily: SANS, fontSize: 11, color: "rgba(232,223,208,0.5)", marginTop: 2 }}>{v.note}</div>
                  </div>
                  <motion.a
                    href={v.mapsUrl} target="_blank" rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.05)" }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      borderRadius: 12, padding: 8, display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background-color 0.3s", cursor: "pointer"
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335" />
                    </svg>
                  </motion.a>
                </div>

                {/* Events at this venue */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {v.events.map((e, idx) => (
                    <div key={idx} style={{
                      display: "flex", gap: 16, paddingLeft: 8,
                      borderLeft: "1px solid rgba(255,183,77,0.2)",
                      position: "relative"
                    }}>
                      <div style={{ flexShrink: 0, width: 45 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: AMBER }}>{e.date}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,183,77,0.4)", textTransform: "uppercase" }}>{e.day}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(232,223,208,0.6)", marginTop: 2 }}>
                          {e.time} · <span style={{ fontStyle: "italic", opacity: 0.7 }}>{e.dress}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </SnapSection>

      {/* RSVP */}
      <SnapSection>
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.2, once: true }}
          style={{
            position: "relative", zIndex: 1,
            width: "100%", maxWidth: 500,
            padding: "0 clamp(20px,5vw,40px)",
            boxSizing: "border-box",
            display: "flex", flexDirection: "column", alignItems: "stretch",
          }}
        >
          <motion.div variants={fadeIn} style={{ textAlign: "center", marginBottom: 28 }}>
            <Eyebrow>Kindly Reply By · 22 April</Eyebrow>
            <div style={{
              fontFamily: SERIF, fontSize: "clamp(32px,6vw,48px)",
              fontWeight: 400, color: PARCHMENT, marginBottom: 16,
              letterSpacing: "2px",
            }}>RSVP</div>
            <Rule />
          </motion.div>
          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -14, transition: { duration: 0.3 } }}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const res = await submitRSVP(form);
                  if (res.success) {
                    setSubmitted(true);
                  } else {
                    setError(res.error || "Something went wrong. Please try again.");
                  }
                }}
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {/* Row 1: Name + Phone */}
                <div style={{ display: "flex", gap: 16, flexDirection: isMobile ? "column" : "row" }}>
                  <motion.label variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                    <span style={{ fontSize: 9, letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(167,243,208,0.55)" }}>Your Name</span>
                    <input type="text" required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Full name" style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.45)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.14)")}
                    />
                  </motion.label>
                  <motion.label variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                    <span style={{ fontSize: 9, letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(167,243,208,0.55)" }}>Phone Number</span>
                    <input type="tel" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+91..." style={inputStyle}
                      onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.45)")}
                      onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.14)")}
                    />
                  </motion.label>
                </div>

                {/* Row 2: Attending Status */}
                <motion.div variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <span style={{ fontSize: 9, letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(167,243,208,0.55)" }}>Will you be attending?</span>
                  <div style={{ display: "flex", gap: 12 }}>
                    {(["yes", "no"] as const).map(v => (
                      <button key={v} type="button" onClick={() => setForm(f => ({ ...f, attending: v }))} style={{
                        ...toggleBase, flex: 1, padding: "12px 16px",
                        lineHeight: 1.4,
                        borderColor: form.attending === v ? "rgba(255,183,77,0.85)" : "rgba(255,183,77,0.14)",
                        color: form.attending === v ? AMBER : "rgba(232,223,208,0.38)",
                        background: form.attending === v ? "rgba(255,183,77,0.08)" : "transparent",
                      }}>{v === "yes" ? "Joyfully accept" : "Regretfully decline"}</button>
                    ))}
                  </div>
                </motion.div>

                {/* Conditional Fields: Guests + Meal */}
                <AnimatePresence>
                  {form.attending === "yes" && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ display: "flex", flexDirection: "column", gap: 20, overflow: "hidden" }}
                    >
                      <div style={{ display: "flex", gap: 16, flexDirection: isMobile ? "column" : "row" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                          <span style={{ fontSize: 9, letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(167,243,208,0.55)" }}>Total Guests</span>
                          <input
                            type="number"
                            min={1}
                            value={form.guests}
                            onChange={e => setForm(f => ({ ...f, guests: parseInt(e.target.value) || 1 }))}
                            style={inputStyle}
                            placeholder="Number of guests"
                            onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.45)")}
                            onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.14)")}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
                          <span style={{ fontSize: 9, letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(167,243,208,0.55)" }}>Meal Preference</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            {(["veg"] as const).map(v => (
                              <button key={v} type="button" onClick={() => setForm(f => ({ ...f, meal: v }))} style={{
                                ...toggleBase, flex: 1, fontSize: 9, padding: "12px 10px",
                                borderColor: "rgba(167,243,208,0.85)",
                                color: "rgba(167,243,208,0.90)",
                                background: "rgba(167,243,208,0.08)",
                              }}>Vegetarian Only</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Message Field */}
                <motion.label variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 9, letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(167,243,208,0.55)" }}>Personal Message</span>
                    <button
                      type="button"
                      onClick={generateAIWish}
                      disabled={!form.name || isGeneratingWish}
                      style={{
                        background: "transparent", border: "none", color: AMBER,
                        fontSize: 10, cursor: form.name ? "pointer" : "default",
                        opacity: form.name ? 1 : 0.3, display: "flex", alignItems: "center", gap: 4
                      }}
                    >
                      {isGeneratingWish ? "Writing..." : "✨ AI Help"}
                    </button>
                  </div>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder={form.name ? "Write something or use AI help..." : "Please enter your name first for AI help..."}
                    style={{ ...inputStyle, minHeight: 100, resize: "none", padding: "14px 18px" }}
                    onFocus={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.45)")}
                    onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,183,77,0.14)")}
                  />
                </motion.label>

                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ color: "#ff6b6b", fontSize: 11, textAlign: "center", marginBottom: 10 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div variants={fadeSlide} style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <button type="submit" disabled={isSubmitting} style={{
                    fontFamily: SANS, fontSize: 10, letterSpacing: "5px",
                    textTransform: "uppercase" as const, fontWeight: 500, color: INK,
                    background: isSubmitting ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,rgba(255,183,77,0.95),rgba(236,72,153,0.85))",
                    border: "none", borderRadius: 2, padding: "16px 56px", cursor: isSubmitting ? "default" : "pointer",
                    whiteSpace: "nowrap",
                    boxShadow: isSubmitting ? "none" : "0 10px 30px rgba(236,72,153,0.25)",
                    opacity: isSubmitting ? 0.5 : 1,
                  }}>{isSubmitting ? "Processing..." : "Send RSVP"}</button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div key="thanks" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                style={{ textAlign: "center", padding: "40px 0" }}
              >
                <Rule />
                <div style={{ fontFamily: SERIF, fontSize: "clamp(20px,4vw,32px)", fontWeight: 400, color: PARCHMENT, marginTop: 28, marginBottom: 14 }}>
                  {form.attending === "yes" ? `We can't wait to see you, ${form.name.split(' ')[0]}!` : `We'll miss you, ${form.name.split(' ')[0]}.`}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: "5px", textTransform: "uppercase" as const, color: "rgba(167,243,208,0.70)" }}>
                  {form.attending === "yes" ? "Your seat is reserved" : "You are in our hearts"}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </SnapSection>

      {/* FOOTER */}
      <SnapSection bg="radial-gradient(ellipse 120% 100% at 50% 50%,#0d1b3e 0%,#050a18 80%)">
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.5, once: true }}
          style={{ textAlign: "center", padding: "0 24px", position: "relative", zIndex: 1 }}
        >
          <motion.div variants={fadeIn}><Rule /></motion.div>
          <motion.div variants={fadeSlide} style={{
            marginTop: 28, fontFamily: SERIF, fontSize: "clamp(26px,5vw,42px)",
            fontWeight: 400, color: "rgba(232,223,208,0.32)",
          }}>
            Apoorva <span style={{ color: "rgba(255,183,77,0.32)", fontSize: "0.55em", verticalAlign: "middle" }}>*</span> Niteen
          </motion.div>
          <motion.div variants={fadeIn} style={{
            marginTop: 14, fontFamily: SANS, fontSize: 8, letterSpacing: "6px",
            textTransform: "uppercase" as const, color: "rgba(232,223,208,0.20)",
          }}>Forever &amp; always</motion.div>
          <motion.div variants={fadeIn} style={{
            marginTop: 32, fontFamily: SANS, fontSize: 8, letterSpacing: "4px",
            textTransform: "uppercase" as const, color: "rgba(255,183,77,0.22)",
          }}>26 April 2026 · GMA Kalyan Mantapa · Ganj</motion.div>
        </motion.div>
      </SnapSection>

    </div>
  );
}
