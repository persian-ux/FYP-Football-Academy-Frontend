import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

export default function CinematicVideoBackground({
  onToggle3DOverlay,
  show3DOverlay = false,
}: CinematicVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const ambientGainRef = useRef<GainNode | null>(null)

  const activeStream = VIDEO_STREAMS[currentStreamIndex]

  // Handle ambient stadium crowd roar synthesis using Web Audio API when unmuted
  useEffect(() => {
    if (!isMuted) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass && !audioContextRef.current) {
          const ctx = new AudioContextClass()
          audioContextRef.current = ctx

          // Create subtle low-pass filtered brown noise for realistic stadium rumble
          const bufferSize = ctx.sampleRate * 2
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
          const output = noiseBuffer.getChannelData(0)
          let lastOut = 0.0
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1
            output[i] = (lastOut + 0.02 * white) / 1.02
            lastOut = output[i]
            output[i] *= 1.5
          }

          const whiteNoise = ctx.createBufferSource()
          whiteNoise.buffer = noiseBuffer
          whiteNoise.loop = true

          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.value = 320
          filter.Q.value = 3.0

          const gainNode = ctx.createGain()
          gainNode.gain.setValueAtTime(0.001, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 1.5)
          ambientGainRef.current = gainNode

          whiteNoise.connect(filter)
          filter.connect(gainNode)
          gainNode.connect(ctx.destination)
          whiteNoise.start()
        } else if (audioContextRef.current && ambientGainRef.current) {
          if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume()
          }
          ambientGainRef.current.gain.cancelScheduledValues(audioContextRef.current.currentTime)
          ambientGainRef.current.gain.linearRampToValueAtTime(0.08, audioContextRef.current.currentTime + 0.5)
        }
      } catch (err) {
        console.warn('Audio ambience initialisation note:', err)
      }
    } else {
      if (ambientGainRef.current && audioContextRef.current) {
        ambientGainRef.current.gain.linearRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.4)
      }
    }

    return () => {
      // Keep audio context managed
    }
  }, [isMuted])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    }
  }

  const switchStream = (idx: number) => {
    setCurrentStreamIndex(idx)
    setIsVideoLoaded(false)
  }

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

      {/* Floating Broadcast Controls Bar (Bottom Left) */}
      <div className="pointer-events-auto absolute bottom-6 left-6 z-40 hidden sm:flex items-center gap-2 rounded-2xl border border-white/15 bg-[#0b111e]/85 px-3 py-2 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/40">
        <Badge
          variant="outline"
          className="border-cyan-500/40 bg-cyan-500/15 text-cyan-300 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 px-2.5 py-1"
        >
          <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
          {activeStream.name}
        </Badge>

        <div className="h-4 w-px bg-white/15" />

        {/* Play/Pause */}
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          className="size-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          title={isPlaying ? 'Pause Video' : 'Play Video'}
        >
          {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 fill-current" />}
        </Button>

        {/* Mute/Unmute Ambient Crowd Sound */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className={`size-8 rounded-lg transition-colors ${
            !isMuted ? 'text-cyan-400 bg-cyan-500/20' : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title={isMuted ? 'Unmute Stadium Ambience' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
        </Button>

        {/* Stream Selector Dropdown Buttons */}
        <div className="flex items-center gap-1">
          {VIDEO_STREAMS.map((stream, idx) => (
            <button
              key={stream.id}
              type="button"
              onClick={() => switchStream(idx)}
              className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
                currentStreamIndex === idx
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Cam {idx + 1}
            </button>
          ))}
        </div>

        {onToggle3DOverlay && (
          <>
            <div className="h-4 w-px bg-white/15" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle3DOverlay}
              className={`h-7 px-2 text-[11px] font-semibold rounded-lg ${
                show3DOverlay ? 'bg-amber-400/20 text-amber-300' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle 3D Tactical Overlay"
            >
              <Sparkles className="size-3 mr-1" />
              3D Tactics
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
