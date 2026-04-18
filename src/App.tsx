import { useState } from "react";
import GateScreen from "./sections/GateScreen";
import CinematicLoveSection from "./sections/CinematicLoveSection";
import EventPage from "./sections/EventPage";
import Dashboard from "./sections/Dashboard";
import AIConcierge from "./components/AIConcierge";

type Phase = "gate" | "cinema" | "event" | "dashboard";

export default function App() {
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== "undefined" && window.location.search.includes("admin")) {
      return "dashboard";
    }
    return "gate";
  });

  return (
    <>
      <AIConcierge />
      {phase === "gate" && (
        <GateScreen
          onComplete={() => setPhase("cinema")}
          onSkip={() => setPhase("event")}
        />
      )}
      {phase === "cinema" && (
        <CinematicLoveSection onComplete={() => setPhase("event")} />
      )}
      {phase === "event" && <EventPage />}
      {phase === "dashboard" && <Dashboard onExit={() => {
        window.history.replaceState({}, "", window.location.pathname);
        setPhase("gate");
      }} />}
    </>
  );
}


