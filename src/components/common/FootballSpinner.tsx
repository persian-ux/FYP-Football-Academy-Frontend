import React, { useState } from "react";

const FootballSpinner: React.FC = () => {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const spin = () => {
    if (spinning) return;

    setSpinning(true);

    // Random final angle between 0 and 360
    const finalAngle = Math.floor(Math.random() * 360);

    // Add multiple spins before stopping
    const totalRotation = rotation + 360 * 5 + finalAngle;

    setRotation(totalRotation);

    // Stop spinning after animation duration
    setTimeout(() => {
      setSpinning(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center mt-12">
      {/* New spinner replacing the football emoji */}
      <div
        className={`relative cursor-pointer transition-transform duration-[3000ms] ease-[cubic-bezier(0.25,1,0.5,1)] ${
          spinning ? "pointer-events-none" : ""
        }`}
        style={{ transform: `rotate(${rotation}deg)` }}
        onClick={spin}
      >
        {/* Outer ring spinner */}
        <div className="relative flex items-center justify-center">
          <div className="size-24 rounded-full border-4 border-primary/20" />
          <div
            className="absolute inset-0 size-24 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
            style={{
              animation: spinning ? "none" : "spin 1.5s linear infinite",
            }}
          />
          <div
            className="absolute inset-2 size-20 rounded-full border-4 border-secondary/20"
          />
          <div
            className="absolute inset-2 size-20 rounded-full border-4 border-t-secondary border-r-transparent border-b-transparent border-l-transparent"
            style={{
              animation: spinning
                ? "none"
                : "spin 2s linear infinite reverse",
            }}
          />
          {/* Center dot */}
          <div className="absolute size-3 rounded-full bg-accent shadow-[0_0_20px_rgba(0,255,136,0.6)]" />
        </div>
      </div>
      <p className="mt-6 text-lg font-medium text-muted-foreground">
        Click to spin!
      </p>
    </div>
  );
};

export default FootballSpinner;