import { useState, useEffect } from "react";
import WelcomeFlow from "./components/WelcomeFlow";
import CinematicLoveSection from "./sections/CinematicLoveSection";
import EventPage from "./sections/EventPage";
import Dashboard from "./sections/Dashboard";
import AIConcierge from "./components/AIConcierge";
import { Language } from "./i18n";

type Phase = "welcome" | "cinema" | "event" | "dashboard";

export default function App() {
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== "undefined" && window.location.search.includes("admin")) {
      return "dashboard";
    }
    return "welcome";
  });

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("wedding_lang") as Language) || "en";
  });

  const [team, setTeam] = useState<'groom' | 'bride'>(() => {
    return (localStorage.getItem("wedding_team") as 'groom' | 'bride') || "groom";
  });

  const handleWelcomeComplete = (selectedLang: Language, selectedTeam: 'groom' | 'bride') => {
    setLang(selectedLang);
    setTeam(selectedTeam);
    localStorage.setItem("wedding_lang", selectedLang);
    localStorage.setItem("wedding_team", selectedTeam);
    setPhase("cinema");
  };

  return (
    <>
      {phase === "event" && <AIConcierge lang={lang} team={team} />}
      {phase === "welcome" && (
        <WelcomeFlow onComplete={handleWelcomeComplete} />
      )}
      {phase === "cinema" && (
        <CinematicLoveSection onComplete={() => setPhase("event")} lang={lang} />
      )}
      {phase === "event" && <EventPage lang={lang} team={team} />}
      {phase === "dashboard" && <Dashboard onExit={() => {
        window.history.replaceState({}, "", window.location.pathname);
        setPhase("welcome");
      }} />}
    </>
  );
}


