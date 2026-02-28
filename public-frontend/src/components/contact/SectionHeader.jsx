import { cn } from '../../lib/cn.js'

function SectionHeader({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
}) {
  return (
    <header className={cn('mx-auto max-w-3xl space-y-3 text-center', className)}>
      <h2
        className={cn(
          'text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl',
          titleClassName,
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p
          className={cn(
            'mx-auto max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base',
            subtitleClassName,
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  )
}

export default SectionHeader
