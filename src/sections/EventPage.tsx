import { useState, useLayoutEffect, useEffect, useRef } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useRSVP } from "../hooks/useRSVP";
import { Language, translations } from "../i18n";
import { getCDNUrl } from "../utils/cdn";

// ====== HAPTIC FEEDBACK ======
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if (!navigator.vibrate) return;
  
  const patterns: Record<string, number | number[]> = {
    light: 10,
    medium: [20, 10, 20],
    heavy: [30, 15, 30],
  };
  
  navigator.vibrate(patterns[type]);
};

// ====== LUXURY DARK DESIGN SYSTEM ======
const SERIF = '"Playfair Display", "Cormorant Garamond", ui-serif, Georgia, serif';
const SANS = '"Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Helvetica, Arial';

// Color Palette
const BG_EVENT = "#0E223A";
const BG_EVENT_SOFT = "#112A45";
const GOLD_EVENT = "#D4AF37";
const TEXT_CREAM = "#F3E9D2";
const TEXT_MUTED = "#CBB89D";
const INK = BG_EVENT;

// Spacing System
const SPACE = {
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "40px",
  xxl: "64px",
};

// Motion System
const EASING_CINEMATIC = [0.33, 1, 0.68, 1] as const;
const DURATION = {
  micro: 0.2,
  ui: 0.4,
  cinematic: 0.8,
} as const;

// Light System - Signature Radial Gradient
const LIGHT_WASH = "radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.08), transparent 70%)";

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

const Rule = () => (
  <div style={{
    width: 64, height: 1, margin: "0 auto",
    background: `linear-gradient(90deg, transparent, ${GOLD_EVENT}, transparent)`,
    opacity: 0.5,
  }} />
);

const pulseGlow = {
  animate: {
    boxShadow: [
      `0 0 0px ${GOLD_EVENT}00`,
      `0 0 12px ${GOLD_EVENT}4d`,
      `0 0 0px ${GOLD_EVENT}00`
    ],
    transition: { duration: 2, repeat: Infinity }
  }
};

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    fontFamily: SANS, fontSize: "12px", letterSpacing: "3px",
    textTransform: "uppercase" as const, color: TEXT_MUTED,
    marginBottom: SPACE.lg, fontWeight: 500,
  }}>{children}</div>
);

const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
};
const fadeSlide = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.cinematic, ease: EASING_CINEMATIC } },
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
    }}>
      {/* Subtle light wash */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: LIGHT_WASH, zIndex: 0,
      }} />
      <div style={{ position: "relative", zIndex: 2 }}>{children}</div>
    </section>
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
  fontFamily: SANS, fontSize: 14, color: TEXT_CREAM,
  background: "rgba(17, 42, 69, 0.6)",
  border: `1px solid ${GOLD_EVENT}24`,
  borderRadius: 8, padding: `${SPACE.md} ${SPACE.lg}`, outline: "none",
  width: "100%", boxSizing: "border-box", transition: "all 0.3s cubic-bezier(0.33, 1, 0.68, 1)",
};
const toggleBase: React.CSSProperties = {
  fontFamily: SANS, fontSize: 10, letterSpacing: "1px",
  textTransform: "uppercase", border: `1px solid ${GOLD_EVENT}38`,
  borderRadius: 8, padding: `12px ${SPACE.lg}`, cursor: "pointer",
  transition: `all ${DURATION.ui}s cubic-bezier(0.33, 1, 0.68, 1)`, background: "transparent",
};

type TeamSide = "groom" | "bride";

type CelebrationEvent = {
  num: string;
  label: string;
  sub: string;
  date: string;
  day: string;
  accent: string;
  glow: string;
  img: string;
  imgH: string;
  imgPos: string;
  titleTop: boolean;
  cardPad: string | undefined;
  mapsUrl: string;
};

type ScheduleEvent = {
  date: string;
  month: string;
  day: string;
  name: string;
  time: string;
  venue: string;
  note: string;
  accent: string;
  dress: string;
  mapsUrl: string;
};

interface EventPageProps { lang?: Language; team?: string; }
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
  const carouselRef = useRef<HTMLDivElement>(null);
  const rsvpRef = useRef<HTMLDivElement>(null);
  const rsvpTouchYRef = useRef<number | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isRsvpFocused, setIsRsvpFocused] = useState(false);
  const [isRsvpInView, setIsRsvpInView] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [isGeneratingWish, setIsGeneratingWish] = useState(false);

  const generateAIWish = async () => {
    if (!form.name || isGeneratingWish) return;
    setIsGeneratingWish(true);
    try {
      const res = await fetch("/api/ai/generate-wish", {
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

  // Carousel center-card detection and parallax effect
  useEffect(() => {
    if (!isMobile || !carouselRef.current) return;

    const carousel = carouselRef.current;
    let rafId: number;

    const handleCarouselScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollLeft = carousel.scrollLeft;
        const containerCenter = carousel.offsetWidth / 2;
        const scrollCenter = scrollLeft + containerCenter;

        // Find cards and track which is closest to center
        const cards = Array.from(carousel.querySelectorAll("[data-card-index]"));
        let closestCard = 0;
        let minDistance = Infinity;

        cards.forEach((card, index) => {
          const cardEl = card as HTMLElement;
          const cardCenter = cardEl.offsetLeft + cardEl.offsetWidth / 2;
          const distance = Math.abs(scrollCenter - cardCenter);

          if (distance < minDistance) {
            minDistance = distance;
            closestCard = index;
          }

          // Apply parallax to card image
          const imageEl = cardEl.querySelector("img") as HTMLImageElement;
          if (imageEl) {
            const parallaxDistance = (scrollCenter - cardCenter) / 10;
            imageEl.style.transform = `translateX(${parallaxDistance}px) scale(1.05)`;
          }
        });

        setActiveCardIndex(closestCard);
      });
    };

    carousel.addEventListener("scroll", handleCarouselScroll);
    return () => {
      carousel.removeEventListener("scroll", handleCarouselScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  const blurActiveRsvpElement = () => {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement && rsvpRef.current?.contains(activeEl)) {
      activeEl.blur();
    }
  };

  const releaseRsvpScrollLock = () => {
    rsvpTouchYRef.current = null;
    setIsRsvpFocused(false);
    blurActiveRsvpElement();
  };

  const canRsvpScrollerMove = (scroller: HTMLDivElement, deltaY: number) => {
    const maxScrollTop = scroller.scrollHeight - scroller.clientHeight;
    if (maxScrollTop <= 1) return false;
    if (deltaY > 0) return scroller.scrollTop < maxScrollTop - 1;
    if (deltaY < 0) return scroller.scrollTop > 1;
    return false;
  };

  useEffect(() => {
    if (!isMobile || !rsvpRef.current || !scrollRef.current) {
      setIsRsvpInView(false);
      return;
    }

    const rsvpEl = rsvpRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting && entry.intersectionRatio >= 0.45;
        setIsRsvpInView(inView);

        if (!inView) {
          releaseRsvpScrollLock();
        }
      },
      {
        root: scrollRef.current,
        threshold: [0, 0.25, 0.45, 0.75, 1],
      }
    );

    observer.observe(rsvpEl);
    return () => observer.disconnect();
  }, [isMobile]);

  const selectedLang: Language = lang && translations[lang] ? lang : "en";
  const t = translations[selectedLang];
  const languageCopy = {
    accept: selectedLang === "en" ? "Joyfully accept" : selectedLang === "kn" ? "Baruttene" : "Aaunga / Aaungi",
    decline: selectedLang === "en" ? "Regretfully decline" : selectedLang === "kn" ? "Baralu sadhyavilla" : "Nahi aa paunga / paungi",
    fullName: selectedLang === "en" ? "Full name" : selectedLang === "kn" ? "Poorna hesaru" : "Poora naam",
    phonePlaceholder: "+91...",
    guestsPlaceholder: selectedLang === "en" ? "Number of guests" : selectedLang === "kn" ? "Atithigala sankhye" : "Mehmanon ki sankhya",
    messagePlaceholder: selectedLang === "en" ? "Write something or use AI help..." : selectedLang === "kn" ? "Sandesha bareyiri athava AI sahaya balasi..." : "Sandesh likhein ya AI sahayata lein...",
    nameFirstPlaceholder: selectedLang === "en" ? "Please enter your name first for AI help..." : selectedLang === "kn" ? "AI sahayakke modalu nimma hesaru namoodisi..." : "AI sahayata ke liye pehle apna naam daalein...",
    writing: selectedLang === "en" ? "Writing..." : selectedLang === "kn" ? "Bareyuttide..." : "Likh raha hai...",
    processing: selectedLang === "en" ? "Processing..." : selectedLang === "kn" ? "Prakriye nadeyuttide..." : "Prakriya jaari hai...",
    somethingWrong: selectedLang === "en" ? "Something went wrong. Please try again." : selectedLang === "kn" ? "Yeno tappagide. Matte prayatnisi." : "Kuch galat hua. Phir koshish karein.",
    swipe: selectedLang === "en" ? "swipe" : selectedLang === "kn" ? "swipe madi" : "swipe karein",
    raichur: selectedLang === "en" ? "Raichur" : selectedLang === "kn" ? "Raichur" : "Raichur",
    bidar: selectedLang === "en" ? "Bidar" : selectedLang === "kn" ? "Bidar" : "Bidar",
    morning: selectedLang === "en" ? "Morning" : selectedLang === "kn" ? "Beligge" : "Subah",
    evening: selectedLang === "en" ? "Evening" : selectedLang === "kn" ? "Sanje" : "Shaam",
    traditional: selectedLang === "en" ? "Traditional" : selectedLang === "kn" ? "Sampradayika" : "Paramparik",
    formalEthnic: selectedLang === "en" ? "Formal / Ethnic" : selectedLang === "kn" ? "Formal / Ethnic" : "Formal / Ethnic",
    casualTraditional: selectedLang === "en" ? "Casual traditional" : selectedLang === "kn" ? "Sarala sampradayika" : "Saadhaaran paramparik",
    haldiSub: selectedLang === "en" ? "A turmeric blessing ceremony in Bidar" : selectedLang === "kn" ? "Bidaralli haldi ashirvada samarambha" : "Bidar mein haldi ashirvad samaroh",
    receptionSub: selectedLang === "en" ? "An evening of light in Raichur" : selectedLang === "kn" ? "Raichuralli sanjeya sambhrama" : "Raichur mein shaam ka utsav",
    marriageSub: selectedLang === "en" ? "Sacred vows at Ganj Kalyan Mantapa" : selectedLang === "kn" ? "Ganj Kalyan Mantapadalli pavitra vachana" : "Ganj Kalyan Mantapa mein pavitra vachan",
    bidarReceptionSub: selectedLang === "en" ? "Celebrating with family in Bidar" : selectedLang === "kn" ? "Bidaralli kutumbada jothe sambhrama" : "Bidar mein parivaar ke saath utsav",
    handraSub: selectedLang === "en" ? "A joyful Handra celebration in Raichur" : selectedLang === "kn" ? "Raichuralli Handra sambhrama" : "Raichur mein Handra utsav",
    brideSideCelebration: selectedLang === "en" ? "Bride side celebration" : selectedLang === "kn" ? "Vadhu kadeya sambhrama" : "Vadhu paksh utsav",
    yellowGreenWelcome: selectedLang === "en" ? "Yellow & green attire welcome" : selectedLang === "kn" ? "Haladi mattu hasiru vastragalige swagata" : "Peeli aur hari poshak ka swagat hai",
    eventVenue: selectedLang === "en" ? "26 April 2026 - Ganj Kalyan Mantapa - Raichur" : selectedLang === "kn" ? "26 April 2026 - Ganj Kalyan Mantapa - Raichur" : "26 April 2026 - Ganj Kalyan Mantapa - Raichur",
  };

  const shouldTrapRsvpScroll = isMobile && isRsvpFocused && isRsvpInView && !submitted;

  const selectedTeam: TeamSide = team === "bride" ? "bride" : "groom";

  const celebrationEventsByTeam: Record<TeamSide, CelebrationEvent[]> = {
    groom: [
      { num: "01", label: t.haldi, sub: languageCopy.haldiSub, date: "23 April", day: "Thursday", accent: "rgba(251,191,36,0.65)", glow: "rgba(251,191,36,0.12)", img: getCDNUrl('haldi', { width: 600 }), imgH: "clamp(170px,28vh,240px)", imgPos: "center", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bidar" },
      { num: "02", label: t.reception, sub: languageCopy.receptionSub, date: "25 April", day: "Saturday", accent: "rgba(167,243,208,0.60)", glow: "rgba(167,243,208,0.10)", img: getCDNUrl('reception', { width: 600 }), imgH: "clamp(170px,28vh,240px)", imgPos: "top", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
      { num: "03", label: t.wedding, sub: languageCopy.marriageSub, date: "26 April", day: "Sunday", accent: "rgba(232,121,249,0.60)", glow: "rgba(232,121,249,0.10)", img: getCDNUrl('marriage', { width: 600 }), imgH: "clamp(170px,28vh,240px)", imgPos: "top", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
      { num: "04", label: t.bidarReception, sub: languageCopy.bidarReceptionSub, date: "28 April", day: "Tuesday", accent: "rgba(251,191,36,0.55)", glow: "rgba(251,191,36,0.10)", img: getCDNUrl('bidar-reception', { width: 600 }), imgH: "clamp(170px,28vh,240px)", imgPos: "center", titleTop: true, cardPad: "3px", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Shree+Function+Hall+Bidar" },
    ],
    bride: [
      { num: "01", label: t.handra, sub: languageCopy.handraSub, date: "24 April", day: "Friday", accent: "rgba(251,191,36,0.65)", glow: "rgba(251,191,36,0.12)", img: getCDNUrl('haldi', { width: 600 }), imgH: "clamp(170px,28vh,240px)", imgPos: "center", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Raichur" },
      { num: "02", label: t.reception, sub: languageCopy.receptionSub, date: "25 April", day: "Saturday", accent: "rgba(167,243,208,0.60)", glow: "rgba(167,243,208,0.10)", img: getCDNUrl('reception', { width: 600 }), imgH: "clamp(170px,28vh,240px)", imgPos: "top", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
      { num: "03", label: t.wedding, sub: languageCopy.marriageSub, date: "26 April", day: "Sunday", accent: "rgba(232,121,249,0.60)", glow: "rgba(232,121,249,0.10)", img: getCDNUrl('marriage', { width: 600 }), imgH: "clamp(170px,28vh,240px)", imgPos: "top", titleTop: false, cardPad: undefined, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
    ],
  };

  const scheduleEventsByTeam: Record<TeamSide, ScheduleEvent[]> = {
    groom: [
      { date: "23", month: "Apr", day: "Thu", name: t.haldi, time: languageCopy.morning, venue: languageCopy.bidar, note: languageCopy.yellowGreenWelcome, accent: "rgba(251,191,36,0.65)", dress: languageCopy.casualTraditional, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bidar" },
      { date: "25", month: "Apr", day: "Sat", name: t.reception, time: languageCopy.evening, venue: "Ganj Kalyan Mantapa", note: languageCopy.raichur, accent: "rgba(167,243,208,0.60)", dress: languageCopy.formalEthnic, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
      { date: "26", month: "Apr", day: "Sun", name: t.wedding, time: languageCopy.morning, venue: "Ganj Kalyan Mantapa", note: languageCopy.raichur, accent: "rgba(232,121,249,0.60)", dress: languageCopy.traditional, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
      { date: "28", month: "Apr", day: "Tue", name: t.reception, time: languageCopy.evening, venue: "Shree Function Hall", note: languageCopy.bidar, accent: "rgba(251,191,36,0.55)", dress: languageCopy.formalEthnic, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Shree+Function+Hall+Bidar" },
    ],
    bride: [
      { date: "24", month: "Apr", day: "Fri", name: t.handra, time: languageCopy.morning, venue: languageCopy.raichur, note: languageCopy.brideSideCelebration, accent: "rgba(251,191,36,0.65)", dress: languageCopy.traditional, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Raichur" },
      { date: "25", month: "Apr", day: "Sat", name: t.reception, time: languageCopy.evening, venue: "Ganj Kalyan Mantapa", note: languageCopy.raichur, accent: "rgba(167,243,208,0.60)", dress: languageCopy.formalEthnic, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
      { date: "26", month: "Apr", day: "Sun", name: t.wedding, time: languageCopy.morning, venue: "Ganj Kalyan Mantapa", note: languageCopy.raichur, accent: "rgba(232,121,249,0.60)", dress: languageCopy.traditional, mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ganj+Kalyan+Mantapa+Raichur" },
    ],
  };

  const events = celebrationEventsByTeam[selectedTeam];
  const scheduleEvents = scheduleEventsByTeam[selectedTeam];

  useEffect(() => {
    setActiveCardIndex(0);
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = 0;
    }
  }, [selectedTeam]);

  return (
    <div
      ref={scrollRef}
      style={{
        height: "100svh", overflowY: "scroll",
        scrollSnapType: shouldTrapRsvpScroll ? "none" : "y mandatory",
        WebkitOverflowScrolling: "touch",
        position: "fixed", inset: 0, zIndex: 100,
      }}
    >
      {/* HERO */}
      <section style={{
        height: "100svh", scrollSnapAlign: "start", scrollSnapStop: "always",
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <ParallaxBg
          src={getCDNUrl('couple-photo-1', { width: 1200 })}
          scrollRef={scrollRef}
          filter="blur(13px) brightness(0.62) saturate(0.75) contrast(1.1)"
        />
        <motion.div
          variants={staggerParent} initial="hidden" animate="show"
          style={{
            position: "relative", zIndex: 2,
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", padding: "clamp(40px, 8vh, 80px) 24px 0", transform: "translateY(8vh)",
          }}
        >
          <motion.div variants={fadeIn} style={{
            fontFamily: SANS, fontSize: "clamp(12px, 3.5vw, 16px)", letterSpacing: selectedLang === 'kn' ? 0 : "6px", wordSpacing: selectedLang === 'kn' ? "0.15em" : undefined,
            textTransform: "uppercase" as const, color: "#d4f5e9", marginBottom: 22,
            textShadow: "0 2px 18px rgba(0,0,0,0.9)",
          }}>{t.welcome}</motion.div>
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
            fontStyle: "italic", color: "rgba(232,223,208,0.60)", marginBottom: 22, marginTop: 22,
          }}>{t.togetherFamilies}</motion.div>
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
        >{languageCopy.swipe}</motion.div>
      </section>

      {/* VERSE */}
      <SnapSection bg={`radial-gradient(ellipse 120% 90% at 50% 60%, ${BG_EVENT_SOFT} 0%, ${INK} 70%)`}>
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.6, once: true }}
          style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 clamp(24px, 8vw, 80px)" }}
        >
          <motion.div variants={fadeIn}><Eyebrow>{t.beginning}</Eyebrow><Rule /></motion.div>
          <motion.div variants={fadeSlide} style={{
            fontFamily: SERIF,
            fontSize: "clamp(20px, 5.5vw, 38px)", color: TEXT_CREAM,
            lineHeight: 1.75, maxWidth: 520, margin: `${SPACE.xl} auto 0`,
          }}>
            {t.beginningQuote}
          </motion.div>
          <motion.div variants={fadeIn} style={{
            marginTop: SPACE.xl, fontFamily: SANS, fontSize: 10, letterSpacing: "2px",
            textTransform: "uppercase" as const, color: `${GOLD_EVENT}66`,
          }}>Niteen &amp; Apoorva · 26 April 2026</motion.div>
        </motion.div>
      </SnapSection>

      {/* CELEBRATIONS */}
      <SnapSection style={{ justifyContent: "flex-start", padding: "0" }}>
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "radial-gradient(ellipse 130% 58% at 14% 18%, rgba(212, 175, 55, 0.06) 0%, transparent 64%), " +
            "radial-gradient(ellipse 95% 48% at 86% 26%, rgba(203, 184, 157, 0.04) 0%, transparent 64%), " +
            "radial-gradient(ellipse 80% 44% at 52% 88%, rgba(243, 233, 210, 0.03) 0%, transparent 64%)",
        }} />
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.25, once: true }}
          style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: isMobile ? 860 : 1200,
            height: "100svh",
            padding: isMobile ? `clamp(16px, 3vh, 32px) clamp(16px, 4vw, 32px)` : `clamp(24px, 4vh, 48px) clamp(24px, 4vw, 48px)`,
            boxSizing: "border-box",
            display: "flex", flexDirection: "column",
          }}
        >
          <motion.div variants={fadeIn} style={{ textAlign: "center", marginBottom: "clamp(10px, 2vh, 18px)", flexShrink: 0 }}>
            <Eyebrow>{t.celebration}</Eyebrow><Rule />
          </motion.div>

          {/* 2×2 cinematic cards — name + mood + date only, fills remaining height */}
          <div ref={carouselRef} style={{
            display: isMobile ? "flex" : "grid",
            gridTemplateColumns: isMobile ? undefined : "repeat(2, 1fr)",
            gridTemplateRows: isMobile ? undefined : "repeat(2, 1fr)",
            flexDirection: isMobile ? "row" : undefined,
            overflowX: isMobile ? "auto" : "visible",
            scrollSnapType: isMobile ? "x mandatory" : "none",
            scrollPaddingInline: isMobile ? "calc((100% - 82vw) / 2)" : undefined,
            scrollBehavior: isMobile ? "smooth" : "auto",
            gap: isMobile ? "20px" : "clamp(16px,2vw,24px)",
            padding: isMobile ? `10px calc((100% - 82vw) / 2) 30px` : "0",
            margin: isMobile ? "0 -20px" : "0",
            flex: 1,
            minHeight: 0,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: isMobile ? "pan-x" as const : undefined,
            overscrollBehaviorX: isMobile ? "contain" : undefined,
          }}>
            {events.map(({ num, label, sub, date, day, accent, glow, img, imgH, imgPos, titleTop, cardPad, mapsUrl }, cardIndex) => (
              <motion.div 
                key={label} 
                variants={fadeSlide}
                data-card-index={cardIndex}
                whileHover={isMobile ? undefined : { scale: 1.015, boxShadow: "0 20px 60px rgba(0,0,0,0.6)" }}
                style={{
                  position: "relative",
                  background: `linear-gradient(145deg, rgba(17, 42, 69, 0.95) 0%, rgba(14, 34, 58, 0.98) 100%)`,
                  border: `1px solid ${accent.replace(/[\d.]+\)$/, "0.22)")}`,
                  borderRadius: 16,
                  padding: isMobile ? "24px" : "18px",
                  backdropFilter: "blur(14px)",
                  transition: `transform 0.4s cubic-bezier(0.33, 1, 0.68, 1), box-shadow 0.4s cubic-bezier(0.33, 1, 0.68, 1), opacity 0.4s cubic-bezier(0.33, 1, 0.68, 1)`,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "stretch",
                  flex: isMobile ? "0 0 82vw" : "1",
                  minHeight: isMobile ? undefined : "clamp(180px, 32vh, 260px)",
                  scrollSnapAlign: isMobile ? "center" : "none",
                  boxShadow: selectedTeam === "groom" && cardIndex === 0 ? "none" : isMobile && cardIndex === activeCardIndex ? "0 20px 60px rgba(212,175,55,0.3)" : isMobile ? "0 10px 30px rgba(0,0,0,0.4)" : "none",
                  transform: isMobile ? (cardIndex === activeCardIndex ? "scale(1)" : "scale(0.88)") : undefined,
                  opacity: isMobile ? (cardIndex === activeCardIndex ? 1 : 0.6) : undefined,
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
                  {!(selectedTeam === "groom" && cardIndex === 0) && (
                    <div style={{
                      position: "absolute", inset: 0,
                      background: `linear-gradient(to top, ${accent.replace(/[\d.]+\)$/, "0.45)")} 0%, transparent 60%)`,
                    }} />
                  )}
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
                      fontFamily: SANS, fontSize: isMobile ? "10px" : "clamp(8px, 1.2vw, 9px)",
                      letterSpacing: "2px", color: accent.replace(/[\d.]+\)$/, "0.55)"),
                      textTransform: "uppercase" as const, flexShrink: 0, fontWeight: 500,
                    }}>{num}</span>
                    <span style={{
                      fontFamily: selectedLang === 'kn' ? '"Noto Serif Kannada", serif' : SERIF,
                      fontSize: selectedLang === 'kn' 
                        ? (isMobile ? "36px" : "clamp(26px, 3.4vw, 32px}")
                        : (isMobile ? "32px" : "clamp(22px, 3vw, 28px)"),
                      color: TEXT_CREAM, lineHeight: 1.2, fontWeight: 500,
                      letterSpacing: selectedLang === 'kn' ? 0 : undefined,
                    }}>{label}</span>
                  </div>

                  {/* subtitle */}
                  {sub && <div style={{
                    fontFamily: SANS, fontSize: isMobile ? "14px" : "clamp(11px, 1.4vw, 13px)",
                    color: TEXT_MUTED,
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
                      <span style={{ fontFamily: SERIF, fontSize: isMobile ? "16px" : "clamp(13px, 1.8vw, 15px)", color: accent.replace(/[\d.]+\)$/, "0.95)"), fontWeight: 600 }}>{date}</span>
                      <span style={{ fontFamily: SANS, fontSize: isMobile ? "9px" : "clamp(8px, 1.2vw, 10px)", letterSpacing: "2px", color: accent.replace(/[\d.]+\)$/, "0.75)"), textTransform: "uppercase" as const }}>{day}</span>
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
                  background: i === activeCardIndex ? GOLD_EVENT : `${TEXT_CREAM}33`,
                  transition: "all 0.3s"
                }} />
              ))}
            </motion.div>
          )}
        </motion.div>
      </SnapSection>

      {/* SCHEDULE - practical details: venue, time, dress code */}
      <SnapSection bg={`radial-gradient(ellipse 100% 80% at 50% 50%, ${BG_EVENT_SOFT} 0%, ${INK} 80%)`} style={{ justifyContent: "flex-start", padding: 0 }}>
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.3, once: true }}
          style={{
            position: "relative", zIndex: 1, width: "100%", maxWidth: isMobile ? 560 : 1080,
            height: "100svh",
            padding: isMobile ? "clamp(16px, 3vh, 28px) clamp(18px, 5vw, 28px)" : "clamp(28px, 5vh, 52px) clamp(36px, 5vw, 64px)",
            boxSizing: "border-box",
            display: "flex", flexDirection: "column",
          }}
        >
          <motion.div variants={fadeIn} style={{ textAlign: "center", marginBottom: isMobile ? "clamp(12px, 2vh, 18px)" : "clamp(18px, 3vh, 28px)", flexShrink: 0 }}>
            <Eyebrow>{t.whereWhen}</Eyebrow><Rule />
          </motion.div>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: isMobile ? 10 : 16,
            flex: 1,
            minHeight: 0,
            alignContent: "center",
          }}>
            {scheduleEvents.map((e, i) => (
              <motion.div key={i} variants={fadeSlide} style={{
                position: "relative",
                display: "flex",
                alignItems: "stretch",
                gap: isMobile ? 12 : 18,
                borderRadius: 14,
                padding: isMobile ? "13px 14px" : SPACE.lg,
                border: `1px solid ${e.accent.replace(/[\d.]+\)$/, "0.28)")}`,
                background: "linear-gradient(145deg, rgba(17, 42, 69, 0.78), rgba(14, 34, 58, 0.92))",
                boxShadow: isMobile ? "none" : "0 14px 42px rgba(0,0,0,0.22)",
                overflow: "hidden",
                minHeight: isMobile ? 102 : 156,
              }}>
                <div aria-hidden="true" style={{
                  position: "absolute", inset: 0,
                  background: `radial-gradient(circle at 16% 10%, ${e.accent.replace(/[\d.]+\)$/, "0.14)")} 0%, transparent 46%)`,
                  pointerEvents: "none",
                }} />

                <div style={{
                  position: "relative", zIndex: 1,
                  width: isMobile ? 54 : 68,
                  flexShrink: 0,
                  borderRight: `1px solid ${e.accent.replace(/[\d.]+\)$/, "0.24)")}`,
                  paddingRight: isMobile ? 12 : 16,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ fontFamily: SERIF, fontSize: isMobile ? 24 : 34, lineHeight: 1, color: e.accent.replace(/[\d.]+\)$/, "0.95)"), fontWeight: 700 }}>{e.date}</div>
                  <div style={{ fontFamily: SANS, fontSize: isMobile ? 9 : 10, letterSpacing: "1px", textTransform: "uppercase", color: TEXT_MUTED, marginTop: 5 }}>{e.month}</div>
                  <div style={{ fontFamily: SANS, fontSize: isMobile ? 8 : 9, letterSpacing: "1px", textTransform: "uppercase", color: `${TEXT_CREAM}66`, marginTop: 3 }}>{e.day}</div>
                </div>

                <div style={{
                  position: "relative", zIndex: 1,
                  flex: 1,
                  minWidth: 0,
                  display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: selectedLang === 'kn' ? '"Noto Serif Kannada", serif' : SERIF, fontSize: selectedLang === 'kn' ? (isMobile ? 22 : 30) : (isMobile ? 20 : 27), lineHeight: 1.2, color: TEXT_CREAM, fontWeight: 600, letterSpacing: selectedLang === 'kn' ? 0 : undefined }}>{e.name}</div>
                      <div style={{ fontFamily: SANS, fontSize: isMobile ? 12 : 13, color: TEXT_MUTED, marginTop: 8, lineHeight: 1.35 }}>{e.time} - {e.dress}</div>
                    </div>
                    <motion.a
                      href={e.mapsUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open map for ${e.venue}`}
                      onClick={() => triggerHaptic('medium')}
                      whileHover={{ scale: 1.06, backgroundColor: e.accent.replace(/[\d.]+\)$/, "0.12)") }}
                      whileTap={{ scale: 0.94 }}
                      style={{
                        width: isMobile ? 34 : 40, height: isMobile ? 34 : 40,
                        borderRadius: 10,
                        border: `1px solid ${e.accent.replace(/[\d.]+\)$/, "0.28)")}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        color: e.accent.replace(/[\d.]+\)$/, "0.95)"),
                        transition: `background-color ${DURATION.ui}s cubic-bezier(0.33, 1, 0.68, 1)`, cursor: "pointer"
                      }}
                    >
                      <svg width={isMobile ? "18" : "20"} height={isMobile ? "18" : "20"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                      </svg>
                    </motion.a>
                  </div>

                  <div style={{
                    marginTop: isMobile ? 10 : 16,
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: SANS, fontSize: isMobile ? 11 : 12,
                    lineHeight: 1.35, color: `${TEXT_CREAM}b3`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: e.accent.replace(/[\d.]+\)$/, "0.8)"), flexShrink: 0 }} />
                    <span style={{ minWidth: 0 }}>{e.venue} - {e.note}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </SnapSection>
      {/* RSVP */}
      <SnapSection style={{ justifyContent: "flex-start", padding: 0 }}>
        <motion.div
          ref={rsvpRef}
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.2, once: true }}
          onFocusCapture={() => {
            setIsRsvpInView(true);
            setIsRsvpFocused(true);
          }}
          onBlurCapture={() => {
            requestAnimationFrame(() => {
              setIsRsvpFocused(Boolean(rsvpRef.current?.contains(document.activeElement)));
            });
          }}
          style={{
            position: "relative", zIndex: 1,
            width: "100%", maxWidth: isMobile ? 560 : 900,
            height: "100svh",
            padding: isMobile ? "clamp(14px, 2.5vh, 24px) clamp(18px, 5vw, 32px)" : "clamp(28px, 5vh, 54px) clamp(36px, 6vw, 72px)",
            boxSizing: "border-box",
            display: "flex", flexDirection: "column", alignItems: "stretch",
          }}
        >
          <motion.div variants={fadeIn} style={{ textAlign: "center", marginBottom: isMobile ? "clamp(12px, 2vh, 18px)" : SPACE.xl, flexShrink: 0 }}>
            <Eyebrow>{t.rsvpDeadline}</Eyebrow>
            <div style={{
              fontFamily: SERIF, fontSize: isMobile ? "clamp(30px, 8vw, 42px)" : "clamp(40px, 5vw, 56px)",
              fontWeight: 400, color: TEXT_CREAM, marginBottom: isMobile ? SPACE.md : SPACE.lg,
              letterSpacing: "2px",
            }}>{t.rsvpTitle}</div>
            <Rule />
          </motion.div>

          <div
            onWheel={shouldTrapRsvpScroll ? e => {
              if (canRsvpScrollerMove(e.currentTarget, e.deltaY)) {
                e.stopPropagation();
              } else {
                releaseRsvpScrollLock();
              }
            } : undefined}
            onTouchStart={shouldTrapRsvpScroll ? e => {
              rsvpTouchYRef.current = e.touches[0]?.clientY ?? null;
            } : undefined}
            onTouchMove={shouldTrapRsvpScroll ? e => {
              const touchY = e.touches[0]?.clientY;
              const lastTouchY = rsvpTouchYRef.current;
              if (touchY == null || lastTouchY == null) return;

              const deltaY = lastTouchY - touchY;
              rsvpTouchYRef.current = touchY;

              if (canRsvpScrollerMove(e.currentTarget, deltaY)) {
                e.stopPropagation();
              } else if (Math.abs(deltaY) > 2) {
                releaseRsvpScrollLock();
              }
            } : undefined}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: submitted ? "visible" : "auto",
              overscrollBehaviorY: shouldTrapRsvpScroll ? "contain" : "auto",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              padding: isMobile ? "0 2px calc(96px + env(safe-area-inset-bottom))" : "0",
              scrollPaddingTop: 18,
            }}
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form key="form" initial={{ opacity: 1 }} exit={{ opacity: 0, y: -14, transition: { duration: 0.3 } }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError(null);
                    const res = await submitRSVP({ ...form, team: selectedTeam, lang: lang || "en" });
                    if (res.success) {
                      triggerHaptic('heavy');
                      setSubmitted(true);
                      setIsRsvpFocused(false);
                      (document.activeElement as HTMLElement | null)?.blur();
                    } else {
                      triggerHaptic('light');
                      setError(res.error || languageCopy.somethingWrong);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: isMobile ? 14 : SPACE.lg,
                    maxWidth: isMobile ? "none" : 760,
                    margin: "0 auto",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: isMobile ? 14 : SPACE.md }}>
                    <motion.label variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: SPACE.sm, minWidth: 0 }}>
                      <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: TEXT_MUTED, fontWeight: 500 }}>{t.name}</span>
                      <input type="text" required value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder={languageCopy.fullName} style={{ ...inputStyle, padding: isMobile ? "13px 16px" : inputStyle.padding, borderRadius: 8 }}
                        onFocus={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}72`)}
                        onBlur={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}24`)}
                      />
                    </motion.label>
                    <motion.label variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: SPACE.sm, minWidth: 0 }}>
                      <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: TEXT_MUTED, fontWeight: 500 }}>{t.phone}</span>
                      <input type="tel" value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder={languageCopy.phonePlaceholder} style={{ ...inputStyle, padding: isMobile ? "13px 16px" : inputStyle.padding, borderRadius: 8 }}
                        onFocus={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}72`)}
                        onBlur={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}24`)}
                      />
                    </motion.label>
                  </div>

                  <motion.div variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
                    <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: TEXT_MUTED, fontWeight: 500 }}>{t.willAttend}</span>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: isMobile ? 10 : SPACE.md }}>
                      {(["yes", "no"] as const).map(v => (
                        <button key={v} type="button" onClick={() => {
                          triggerHaptic('light');
                          setForm(f => ({ ...f, attending: v }));
                        }} style={{
                          ...toggleBase,
                          minHeight: isMobile ? 56 : 48,
                          padding: isMobile ? "10px 8px" : "12px 16px",
                          lineHeight: 1.35,
                          fontSize: isMobile ? 9 : 10,
                          borderColor: form.attending === v ? GOLD_EVENT : `${GOLD_EVENT}38`,
                          color: form.attending === v ? GOLD_EVENT : TEXT_MUTED,
                          background: form.attending === v ? `${GOLD_EVENT}1a` : "transparent",
                        }}>{v === "yes" ? languageCopy.accept : languageCopy.decline}</button>
                      ))}
                    </div>
                  </motion.div>

                  <AnimatePresence>
                    {form.attending === "yes" && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        style={{ display: "flex", flexDirection: "column", gap: SPACE.lg, overflow: "hidden" }}
                      >
                        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr)", gap: SPACE.md }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: SPACE.sm, minWidth: 0 }}>
                            <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: TEXT_MUTED, fontWeight: 500 }}>{t.guests}</span>
                            <input
                              type="number"
                              min={1}
                              value={form.guests}
                              onChange={e => setForm(f => ({ ...f, guests: parseInt(e.target.value) || 1 }))}
                              style={{ ...inputStyle, padding: isMobile ? "13px 16px" : inputStyle.padding, borderRadius: 8 }}
                              placeholder={languageCopy.guestsPlaceholder}
                              onFocus={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}72`)}
                              onBlur={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}24`)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.label variants={fadeSlide} style={{ display: "flex", flexDirection: "column", gap: SPACE.sm }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: TEXT_MUTED, fontWeight: 500 }}>{t.message}</span>
                      <button
                        type="button"
                        onClick={generateAIWish}
                        disabled={!form.name || isGeneratingWish}
                        style={{
                          background: "transparent", border: "none", color: GOLD_EVENT,
                          fontSize: 10, cursor: form.name ? "pointer" : "default",
                          opacity: form.name ? 1 : 0.3, display: "flex", alignItems: "center", gap: SPACE.sm,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {isGeneratingWish ? languageCopy.writing : t.aiHelp}
                      </button>
                    </div>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder={form.name ? languageCopy.messagePlaceholder : languageCopy.nameFirstPlaceholder}
                      style={{ ...inputStyle, minHeight: isMobile ? 96 : 116, resize: "vertical", padding: isMobile ? "13px 16px" : `${SPACE.md} ${SPACE.lg}`, borderRadius: 8 }}
                      onFocus={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}72`)}
                      onBlur={e => (e.currentTarget.style.borderColor = `${GOLD_EVENT}24`)}
                    />
                  </motion.label>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ color: "#ff6b6b", fontSize: 11, textAlign: "center", marginBottom: 10 }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.div variants={fadeSlide} style={{ display: "flex", justifyContent: "center", marginTop: isMobile ? 2 : SPACE.md }}>
                    <button type="submit" disabled={isSubmitting} style={{
                      fontFamily: SANS, fontSize: 10, letterSpacing: "1px",
                      textTransform: "uppercase" as const, fontWeight: 600, color: INK,
                      background: isSubmitting ? `${GOLD_EVENT}1a` : `linear-gradient(135deg, ${GOLD_EVENT}, rgba(212, 175, 55, 0.8))`,
                      border: "none", borderRadius: 8,
                      padding: isMobile ? "15px 22px" : `${SPACE.lg} 56px`,
                      cursor: isSubmitting ? "default" : "pointer",
                      width: isMobile ? "100%" : "auto",
                      whiteSpace: "nowrap",
                      boxShadow: isSubmitting ? "none" : `0 10px 30px ${GOLD_EVENT}40`,
                      opacity: isSubmitting ? 0.5 : 1,
                      transition: `all ${DURATION.ui}s cubic-bezier(0.33, 1, 0.68, 1)`,
                    }}>{isSubmitting ? languageCopy.processing : t.sendRSVP}</button>
                  </motion.div>
                </motion.form>
              ) : (
                <motion.div key="thanks" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: EASING_CINEMATIC }}
                  style={{ textAlign: "center", padding: "40px 0" }}
                >
                  <Rule />
                  <div style={{ fontFamily: SERIF, fontSize: "clamp(20px, 4vw, 32px)", fontWeight: 400, color: TEXT_CREAM, marginTop: SPACE.xl, marginBottom: SPACE.lg }}>
                    {form.attending === "yes" ? `${t.cantWait}${form.name.split(' ')[0]}!` : `${t.missYou}${form.name.split(' ')[0]}.`}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: TEXT_MUTED }}>
                    {form.attending === "yes" ? t.seatReserved : t.inOurHearts}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </SnapSection>
      {/* FOOTER */}
      <SnapSection bg={`radial-gradient(ellipse 120% 100% at 50% 50%, ${BG_EVENT_SOFT} 0%, ${INK} 80%)`}>
        <motion.div
          variants={staggerParent} initial="hidden" whileInView="show"
          viewport={{ root: scrollRef, amount: 0.5, once: true }}
          style={{ textAlign: "center", padding: "0 24px", position: "relative", zIndex: 1 }}
        >
          <motion.div variants={fadeIn}><Rule /></motion.div>
          <motion.div variants={fadeSlide} style={{
            marginTop: SPACE.xl, fontFamily: SERIF, fontSize: "clamp(26px, 5vw, 42px)",
            fontWeight: 400, color: `${TEXT_CREAM}52`,
          }}>
            Apoorva <span style={{ color: `${GOLD_EVENT}52`, fontSize: "0.55em", verticalAlign: "middle" }}>*</span> Niteen
          </motion.div>
          <motion.div variants={fadeIn} style={{
            marginTop: SPACE.lg, fontFamily: SANS, fontSize: "clamp(16px, 2.5vw, 32px)", letterSpacing: "2px",
            textTransform: "uppercase" as const, color: `${TEXT_CREAM}33`,
          }}>{t.foreverAlways}</motion.div>
          <motion.div variants={fadeIn} style={{
            marginTop: SPACE.xl, fontFamily: SANS, fontSize: "clamp(14px, 2vw, 28px)", letterSpacing: "2px",
            textTransform: "uppercase" as const, color: `${GOLD_EVENT}38`,
          }}>{languageCopy.eventVenue}</motion.div>
        </motion.div>
      </SnapSection>

    </div>
  );
}
