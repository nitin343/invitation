import { useState } from "react";
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
  const [selectedLang, setSelectedLang] = useState<Language>("en");
  const [selectedTeam, setSelectedTeam] = useState<"groom" | "bride">("groom");

  const handleWelcomeComplete = (lang: Language, team: "groom" | "bride") => {
    setSelectedLang(lang);
    setSelectedTeam(team);
    setPhase("cinema");
  };

  return (
    <>
      <AIConcierge />
      {phase === "welcome" && (
        <WelcomeFlow onComplete={handleWelcomeComplete} />
      )}
      {phase === "cinema" && (
        <CinematicLoveSection onComplete={() => setPhase("event")} lang={selectedLang} />
      )}
      {phase === "event" && <EventPage lang={selectedLang} team={selectedTeam} />}
      {phase === "dashboard" && <Dashboard onExit={() => {
        window.history.replaceState({}, "", window.location.pathname);
        setPhase("welcome");
      }} />}
    </>
  );
}


