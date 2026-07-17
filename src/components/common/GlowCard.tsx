import { useEffect, useRef, useState, type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type GlowCardProps = ComponentProps<'div'> & {
  glowClassName?: string
}

export function GlowCard({ className, glowClassName, children, ...props }: GlowCardProps) {
  const [pointer, setPointer] = useState({ x: 50, y: 50, visible: false })
  const cardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!cardRef.current) {
      return
    }

    cardRef.current.style.setProperty('--glow-x', `${pointer.x}%`)
    cardRef.current.style.setProperty('--glow-y', `${pointer.y}%`)
  }, [pointer.x, pointer.y])

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-border/70 bg-card/75 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all duration-300 ease-in-out hover:-translate-y-2 hover:scale-[1.01] hover:border-primary/40',
        className
      )}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        setPointer({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
          visible: true,
        })
      }}
      onMouseLeave={() => setPointer((current) => ({ ...current, visible: false }))}
      {...props}
    >
      <div
        className={cn(
          'glow-card__glow pointer-events-none absolute inset-0 transition-opacity duration-300',
          glowClassName,
          pointer.visible && 'opacity-100'
        )}
        aria-hidden="true"
      />
      <div className="relative">{children}</div>
    </div>
  )
}
