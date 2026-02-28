import { Card, CardContent } from '../ui/index.jsx'
import { cn } from '../../lib/cn.js'

function ContactInfoCard({
  icon,
  title,
  lines = [],
  badgeClassName,
  className,
}) {
  const contentLines = (Array.isArray(lines) ? lines : [])
    .map((line) => String(line || '').trim())
    .filter(Boolean)
    .slice(0, 2)

  return (
    <Card
      tabIndex={0}
      className={cn(
        'h-full rounded-2xl border border-border/80 bg-surface/95 shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(15,23,42,0.12)] focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <CardContent className="flex h-full flex-col items-center gap-4 p-6 text-center">
        <span
          className={cn(
            'inline-flex h-14 w-14 items-center justify-center rounded-full',
            badgeClassName,
          )}
          aria-hidden="true"
        >
          {icon}
        </span>

        <h3 className="text-xl font-semibold text-foreground">{title}</h3>

        <div className="space-y-1.5">
          {contentLines.length > 0 ? (
            contentLines.map((line, index) => (
              <p
                key={`${title}-line-${index}`}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {line}
              </p>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">
              No details available.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ContactInfoCard
