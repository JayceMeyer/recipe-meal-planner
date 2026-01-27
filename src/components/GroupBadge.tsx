import { cn } from '@/lib/utils'

interface GroupBadgeProps {
  name: string
  className?: string
  onClick?: () => void
}

export function GroupBadge({ name, className, onClick }: GroupBadgeProps) {
  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        'bg-primary/10 text-primary',
        onClick && 'hover:bg-primary/20 cursor-pointer',
        className
      )}
    >
      {name}
    </Component>
  )
}
