import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ProgressBar } from "./ProgressBar";
import logoUrl from "./Logo.svg";
import logoSvg from "./Logo.svg?raw";
import bgSvg from "./Background.svg?raw";
import "./splash.css";

declare global {
  interface Window {
    aventasSplash?: {
      onProgress: (cb: (p: { pct: number; msg?: string }) => void) => void;
    };
    aventasSplashCtl?: {
      minimize: () => void;
      close: () => void;
    };
  }
}

const PHASES = [
  { until: 14, label: "Initializing Aventas…" },
  { until: 28, label: "Loading assets…" },
  { until: 42, label: "Authenticating…" },
  { until: 56, label: "Fetching player data…" },
  { until: 70, label: "Building cache…" },
  { until: 84, label: "Preparing interface…" },
  { until: 101, label: "Almost ready…" },
] as const;

function phaseFor(pct: number): string {
  return PHASES.find((p) => pct < p.until)!.label;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

export default function Splash() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>(PHASES[0].label);
  const [done, setDone] = useState(false);
  const raf = useRef<number>(0);

  useEffect(() => {
    let simulated = 0;
    let realPct: number | null = null;
    let last = performance.now();

    if (window.aventasSplash) {
      window.aventasSplash.onProgress(({ pct, msg }) => {
        realPct = pct;
        if (msg) setStatus(msg);
        else setStatus(phaseFor(pct));
        if (pct >= 100) setDone(true);
      });
    }

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      if (realPct === null) {
        simulated += (90 - simulated) * 0.045 * dt * 10;
        setProgress(simulated);
        setStatus(phaseFor(simulated));
      } else {
        simulated += (realPct - simulated) * Math.min(1, dt * 6);
        setProgress(simulated);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    if (done) setStatus("Ready");
  }, [done]);

  return (
    <motion.div
      className="splash"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="splash__bg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: bgSvg }} />

      <div className="splash__chrome">
        <img className="splash__chrome-logo" src={logoUrl} alt="" draggable={false} />
        <span>Aventas Tracker</span>
        <div className="splash__win-controls">
          <button className="splash__win-btn" aria-label="Minimize" onClick={() => window.aventasSplashCtl?.minimize()}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 6h10" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
          <button className="splash__win-btn splash__win-btn--close" aria-label="Close" onClick={() => window.aventasSplashCtl?.close()}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
        </div>
      </div>

      <div className="splash__content">
        <motion.div
          className="splash__logo-wrap"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut, delay: 0.1 }}
        >
          <div className="splash__logo" role="img" aria-label="Aventas logo" dangerouslySetInnerHTML={{ __html: logoSvg }} />
        </motion.div>

        <motion.h1
          className="splash__wordmark"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.35 }}
        >
          AVENTAS
        </motion.h1>

        <motion.p
          className="splash__sub"
          initial={{ opacity: 0, letterSpacing: "1.3em" }}
          animate={{ opacity: 1, letterSpacing: "0.92em" }}
          transition={{ duration: 0.9, ease: easeOut, delay: 0.5 }}
        >
          TRACKER
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut, delay: 0.7 }}
        >
          <ProgressBar value={progress} />
        </motion.div>

        <motion.p
          className="splash__status"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <span className="splash__status-dot" />
          {status}
        </motion.p>
      </div>
    </motion.div>
  );
}