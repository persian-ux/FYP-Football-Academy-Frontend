import { useScrollProgress } from '../../hooks/useScrollProgress'
import '../3D/football-3d.css'

const SECTION_LABELS = ['Pre-Match', 'Kickoff', 'Attack', 'Shooting', 'GOAL!', 'Final']
const SECTION_ICONS = ['🏟️', '⚽', '🏃', '🎯', '🎉', '🏆']

// Broadcast-style match HUD: clock, section icons, final action label.
const ScrollProgressHUD = () => {
  const { scrollProgress, scrollSection } = useScrollProgress()

  // Keep the hero's own "scroll" hint visible — HUD fades in after the first 3%.
  if (scrollProgress < 0.03) return null

  const score = scrollSection >= 4 ? '1 - 0' : '0 - 0'

  return (
    <div className="scroll-hud" aria-hidden="true">
      <div className="hud-progress-bar">
        <span className="hud-time">{String(Math.floor(scrollProgress * 90)).padStart(2, '0')}'</span>
        <div className="hud-bar-track">
          <div className="hud-bar-fill" style={{ width: `${scrollProgress * 100}%` }} />
        </div>
        <span className="hud-score">{score}</span>
      </div>

      <div className="hud-sections">
        {SECTION_ICONS.map((icon, i) => (
          <span
            key={i}
            className={`hud-section ${scrollSection === i ? 'active' : ''}`}
            title={SECTION_LABELS[i]}
          >
            {icon}
          </span>
        ))}
      </div>

      <div className="hud-action-label">{SECTION_LABELS[scrollSection]}</div>
    </div>
  )
}

export default ScrollProgressHUD