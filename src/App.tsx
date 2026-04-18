import { useState } from "react";
import GateScreen from "./sections/GateScreen";
import CinematicLoveSection from "./sections/CinematicLoveSection";
import EventPage from "./sections/EventPage";

type Phase = "gate" | "cinema" | "event";

export default function App() {
  const [phase, setPhase] = useState<Phase>("gate");

  return (
    <>
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
    </>
  );
}


