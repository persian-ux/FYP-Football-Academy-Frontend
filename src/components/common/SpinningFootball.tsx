import React from 'react'

interface SpinningFootballProps {
  className?: string
  spinDuration?: string
}

export default function SpinningFootball({
  className = 'size-6',
  spinDuration = '6s',
}: SpinningFootballProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        animation: `ssFootballSpin ${spinDuration} linear infinite`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 3D Sphere Shading */}
          <radialGradient id="fbSphere3D" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0.75" />
          </radialGradient>
          {/* Specular Highlight Glint */}
          <radialGradient id="fbGlint" cx="28%" cy="24%" r="22%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {/* Realistic Leather Panel Gradient */}
          <linearGradient id="fbLeather" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#cbd5e1" />
          </linearGradient>
          {/* Pentagon Patch Gradient */}
          <linearGradient id="fbPatch" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        {/* Outer Sphere Base */}
        <circle cx="50" cy="50" r="47" fill="url(#fbLeather)" stroke="#0ea5e9" strokeWidth="1.5" />

        {/* Center Pentagon */}
        <polygon
          points="50,33 66,45 60,64 40,64 34,45"
          fill="url(#fbPatch)"
          stroke="#1e293b"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Seam lines from Center Pentagon to Outer Pentagons */}
        <line x1="50" y1="33" x2="50" y2="15" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="66" y1="45" x2="84" y2="39" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="60" y1="64" x2="72" y2="82" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="40" y1="64" x2="28" y2="82" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="34" y1="45" x2="16" y2="39" stroke="#334155" strokeWidth="2.2" strokeLinecap="round" />

        {/* Top Outer Pentagon Patch */}
        <polygon
          points="50,15 37,4 63,4"
          fill="url(#fbPatch)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        {/* Top Outer Seams */}
        <line x1="37" y1="4" x2="22" y2="17" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        <line x1="63" y1="4" x2="78" y2="17" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

        {/* Top-Right Outer Pentagon Patch */}
        <polygon
          points="84,39 96,27 96,53"
          fill="url(#fbPatch)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        <line x1="96" y1="27" x2="78" y2="17" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        <line x1="96" y1="53" x2="90" y2="70" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

        {/* Bottom-Right Outer Pentagon Patch */}
        <polygon
          points="72,82 90,70 63,96"
          fill="url(#fbPatch)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        <line x1="63" y1="96" x2="47" y2="97" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

        {/* Bottom-Left Outer Pentagon Patch */}
        <polygon
          points="28,82 10,70 37,96"
          fill="url(#fbPatch)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        <line x1="37" y1="96" x2="53" y2="97" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

        {/* Top-Left Outer Pentagon Patch */}
        <polygon
          points="16,39 4,27 4,53"
          fill="url(#fbPatch)"
          stroke="#1e293b"
          strokeWidth="1.5"
        />
        <line x1="4" y1="27" x2="22" y2="17" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="53" x2="10" y2="70" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

        {/* 3D Depth Spherical Gradient Overlay */}
        <circle cx="50" cy="50" r="47" fill="url(#fbSphere3D)" />

        {/* Glint & Glow */}
        <circle cx="50" cy="50" r="47" fill="url(#fbGlint)" />

        {/* Subtle Cyan Cyber Glow Accent Rim */}
        <circle
          cx="50"
          cy="50"
          r="47"
          stroke="#38bdf8"
          strokeWidth="2"
          strokeOpacity="0.6"
        />
      </svg>
    </div>
  )
}
