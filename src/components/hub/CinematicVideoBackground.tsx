import { useRef, useState } from 'react'

export interface VideoStreamOption {
  id: string
  name: string
  label: string
  url: string
  poster?: string
}

// Curated high-performance cinematic football video streams
export const VIDEO_STREAMS: VideoStreamOption[] = [
  {
    id: 'night-floodlights',
    name: 'Night Stadium',
    label: 'Main Pitch • Floodlights 4K',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-stadium-lights-at-night-4228-large.mp4',
    poster: '/stadium-hero.jpg',
  },
  {
    id: 'match-action',
    name: 'Match Action',
    label: 'Elite Training & Drills',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-football-player-running-on-the-field-41470-large.mp4',
    poster: '/stadium-hero.jpg',
  },
  {
    id: 'aerial-pitch',
    name: 'Tactical Aerial',
    label: 'Stadium Arena Flyover',
    url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-soccer-field-4240-large.mp4',
    poster: '/stadium-hero.jpg',
  },
]

interface CinematicVideoBackgroundProps {
  onToggle3DOverlay?: () => void
  show3DOverlay?: boolean
}

export default function CinematicVideoBackground({}: CinematicVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [currentStreamIndex] = useState(0)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)

  const activeStream = VIDEO_STREAMS[currentStreamIndex]

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#070a12]">
      {/* Background Poster fallback for instant render */}
      <img
        src="/stadium-hero.jpg"
        alt="Football Stadium Atmosphere"
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-30' : 'opacity-80'
        }`}
        loading="eager"
      />

      {/* Main Looping HD Cinematic Video */}
      <video
        ref={videoRef}
        key={activeStream.id}
        src={activeStream.url}
        poster={activeStream.poster || '/stadium-hero.jpg'}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => {
          setIsVideoLoaded(true)
          if (videoRef.current) {
            videoRef.current.playbackRate = 0.95 // Cinematic pacing
          }
        }}
        className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${
          isVideoLoaded ? 'opacity-70' : 'opacity-0'
        }`}
      />

      {/* Cinematic Lighting & Color Grading Overlays */}
      {/* Layer 1: Dark Obsidian Vignette to ensure text readability */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_35%] from-transparent via-[#0b101d]/60 to-[#060911]/95" />

      {/* Layer 2: Pitch & Floodlight Atmospheric Lighting Gradients */}
      <div className="absolute inset-0 bg-linear-to-b from-[#070b14]/75 via-transparent to-[#070a12]" />
      <div className="absolute inset-0 bg-linear-to-r from-[#060912]/80 via-transparent to-[#060912]/80" />

      {/* Layer 3: Realistic Floodlight Volumetric Shafts */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-[700px] w-[350px] -rotate-12 bg-linear-to-b from-cyan-400/10 via-cyan-500/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -top-24 right-1/4 h-[700px] w-[350px] rotate-12 bg-linear-to-b from-amber-300/10 via-amber-500/5 to-transparent blur-3xl" />

      {/* Layer 4: Broadcast Scanline / HUD Micro Grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:48px_48px]" />
    </div>
  )
}
