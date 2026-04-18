import { useEffect, useRef, useCallback, useState } from "react";

/**
 * Cinematic ambient audio pad — built entirely with Web Audio API, no file needed.
 *
 * Architecture:
 *   oscillators (3x sine) → gain → filter → master gain → destination
 *
 * Timeline (mirrors 20s cinematic):
 *   0–4s   : pad fades in softly
 *   4–8s   : filter opens (curiosity)
 *   8–14s  : slight swell (ring / emotional)
 *   14–17s : soft dip
 *   17–20s : final resolve, gentle fade out
 */

// Frequencies for a warm, romantic ambient pad (Bb + F + Bb octave above)
const FREQS = [58.27, 87.31, 116.54, 174.61]; // Bb2 F3 Bb3 F4

export function useAmbientAudio() {
  const ctxRef   = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);

  const start = useCallback((durationSec: number) => {
    if (ctxRef.current) return; // already started

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    // Master gain — starts at 0
    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.connect(ctx.destination);
    masterRef.current = master;

    // Low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(800, ctx.currentTime + 4);   // opens 0–4s
    filter.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 8);  // full open 4–8s
    filter.frequency.linearRampToValueAtTime(900, ctx.currentTime + 14);  // dip 8–14s
    filter.frequency.linearRampToValueAtTime(600, ctx.currentTime + 17);  // resolve 14–17s
    filter.Q.setValueAtTime(0.8, ctx.currentTime);
    filter.connect(master);

    // Create oscillators
    FREQS.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      // Detune slightly for warmth
      osc.detune.value = (i % 2 === 0 ? 1 : -1) * (i * 3);

      const oscGain = ctx.createGain();
      // Base volumes — higher partials quieter
      const baseVol = i === 0 ? 0.22 : i === 1 ? 0.16 : i === 2 ? 0.10 : 0.06;
      oscGain.gain.setValueAtTime(baseVol, ctx.currentTime);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationSec + 2);
    });

    const t = ctx.currentTime;

    // Master gain curve — matches cinematic emotional arc
    master.gain.setValueAtTime(0,     t);
    master.gain.linearRampToValueAtTime(0.6,  t + 3);    // 0–3s fade in
    master.gain.linearRampToValueAtTime(0.7,  t + 8);    // 3–8s swell
    master.gain.linearRampToValueAtTime(0.85, t + 14);   // 8–14s emotional peak
    master.gain.linearRampToValueAtTime(0.55, t + 17);   // 14–17s dip
    master.gain.linearRampToValueAtTime(0.65, t + 19);   // 17–19s resolve swell
    master.gain.linearRampToValueAtTime(0,    t + durationSec + 1); // fade to silence

  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    if (masterRef.current && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.cancelScheduledValues(now);
      if (mutedRef.current) {
        masterRef.current.gain.linearRampToValueAtTime(0, now + 0.4);
      } else {
        masterRef.current.gain.linearRampToValueAtTime(0.65, now + 0.4);
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (masterRef.current && ctxRef.current) {
      const now = ctxRef.current.currentTime;
      masterRef.current.gain.linearRampToValueAtTime(0, now + 1);
      setTimeout(() => {
        ctxRef.current?.close();
        ctxRef.current = null;
      }, 1200);
    }
  }, []);

  useEffect(() => {
    return () => {
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return { start, stop, toggleMute, muted };
}
