import React from "react";
import "./progress-bar.css";

interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className="pbar" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className="pbar__track">
        <div className="pbar__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}