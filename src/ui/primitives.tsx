/**
 * Composants de base, dans l'esprit shadcn/ui : copiés dans le projet,
 * modifiables, construits sur Tailwind et, quand c'est utile, sur Radix
 * (accessibilité clavier et lecteurs d'écran).
 */
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cva, type VariantProps } from 'class-variance-authority'
import { clsx, type ClassValue } from 'clsx'
import { X } from 'lucide-react'
import * as React from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
        outline: 'border border-input bg-card hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        destructive: 'bg-negative text-white hover:bg-negative/90',
        link: 'text-primary underline-offset-4 hover:underline px-0',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
))
Button.displayName = 'Button'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 p-5 pb-3', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold leading-tight', className)} {...props} />
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn('flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50', className)}
      {...props}
    />
  )
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('text-sm font-medium leading-none', className)} {...props} />
}

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      default: 'border-transparent bg-accent text-accent-foreground',
      outline: 'text-muted-foreground',
      positive: 'border-transparent bg-positive/15 text-positive',
      negative: 'border-transparent bg-negative/15 text-negative',
      neutral: 'border-transparent bg-neutral/15 text-neutral',
      suggestion: 'border-transparent bg-suggestion/15 text-suggestion',
      warning: 'border-transparent bg-warning/20 text-foreground',
    },
  },
  defaultVariants: { tone: 'default' },
})

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export function Progress({ value, className, label }: { value: number; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v)}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', className)}
    >
      <div className="h-full bg-primary transition-all" style={{ width: `${v}%` }} />
    </div>
  )
}

export function Alert({
  className,
  tone = 'info',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: 'info' | 'warning' | 'error' | 'success' }) {
  const tones = {
    info: 'border-primary/30 bg-accent/60',
    warning: 'border-warning/60 bg-warning/10',
    error: 'border-negative/50 bg-negative/10',
    success: 'border-positive/50 bg-positive/10',
  }
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-lg border p-3 text-sm', tones[tone], className)} {...props} />
}

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn('inline-flex h-10 items-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground', className)}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export const TabsContent = TabsPrimitive.Content

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-5 shadow-xl',
            className,
          )}
        >
          <DialogPrimitive.Title className="pr-8 text-lg font-semibold">{title}</DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">{description}</DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          )}
          <div className="mt-4">{children}</div>
          <DialogPrimitive.Close
            className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent cursor-pointer"
            aria-label="Fermer"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/** Bloc repliable natif : accessible, imprimable, sans dépendance. */
export function Disclosure({
  summary,
  children,
  defaultOpen,
  className,
}: {
  summary: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  return (
    <details open={defaultOpen} className={cn('group rounded-lg border bg-card', className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 p-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">{summary}</span>
        <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-90">
          ›
        </span>
      </summary>
      <div className="border-t p-3">{children}</div>
    </details>
  )
}

/**
 * Infobulle : s'ouvre au survol et au focus clavier. Elle complète un libellé,
 * elle ne le remplace jamais (sur écran tactile, elle ne s'affiche pas).
 */
export function Tooltip({ content, children, side = 'bottom' }: { content: React.ReactNode; children: React.ReactElement; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={12}
            className="z-50 max-w-72 rounded-md border bg-card px-3 py-2 text-xs leading-relaxed text-foreground shadow-lg"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}
