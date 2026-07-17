import { useState, type ComponentProps } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type RippleButtonProps = ComponentProps<typeof Button>

export function RippleButton({ className, onClick, children, ...props }: RippleButtonProps) {
  const [isRippling, setIsRippling] = useState(false)

  return (
    <Button
      className={cn('ripple-button relative overflow-hidden', className)}
      data-ripple={isRippling ? 'true' : 'false'}
      onClick={(event) => {
        setIsRippling(true)

        window.setTimeout(() => {
          setIsRippling(false)
        }, 600)

        console.log('Ripple button click', event.currentTarget.textContent?.trim())
        onClick?.(event)
      }}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </Button>
  )
}
