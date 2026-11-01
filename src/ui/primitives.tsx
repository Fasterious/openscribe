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
import { Check, ChevronDown, X } from 'lucide-react'
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
        default: 'border border-transparent bg-primary text-primary-foreground hover:bg-primary/90',
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
  return <div className={cn('rounded-lg border bg-card text-card-foreground', className)} {...props} />
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

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50', className)}
    {...props}
  />
))
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground disabled:opacity-50',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm disabled:opacity-50', className)} {...props} />
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
      question: 'border-transparent bg-question/15 text-question',
      warning: 'border-transparent bg-warning/20 text-foreground',
    },
  },
  defaultVariants: { tone: 'default' },
})

export function Badge({ className, tone, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
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

export function Alert({ className, tone = 'info', ...props }: React.HTMLAttributes<HTMLDivElement> & { tone?: 'info' | 'warning' | 'error' | 'success' }) {
  // Un filet de couleur à gauche sur fond neutre : le ton se lit sans faire une tache de couleur dans la page (refonte du 25/10).
  const tones = {
    info: 'border-l-primary',
    warning: 'border-l-warning',
    error: 'border-l-negative',
    success: 'border-l-positive',
  }
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-md border-l-2 bg-muted/70 px-3.5 py-3 text-sm', tones[tone], className)} {...props} />
}

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  // Onglets soulignés, posés sur le filet de l'en-tête : la page s'ancre sur une seule ligne (refonte du 25/10).
  return <TabsPrimitive.List className={cn('inline-flex h-11 items-stretch gap-6 text-muted-foreground', className)} {...props} />
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative -mb-px inline-flex items-center justify-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-0.5 text-sm font-medium transition-colors cursor-pointer hover:text-foreground data-[state=active]:border-foreground data-[state=active]:text-foreground disabled:opacity-50 disabled:hover:text-muted-foreground',
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
          <DialogPrimitive.Close className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent cursor-pointer" aria-label="Fermer">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * L'indicateur d'ouverture unique de l'application (designer-ui, 20/10) : un chevron vers le bas, après le libellé, qui
 * tourne de 180° à l'ouverture en 200 ms, sans mouvement si le lecteur l'a demandé. Pour un `<details>` natif, ne pas
 * passer `open` mais une classe `group-open/<nom>:rotate-180` (un groupe nommé : un `group` anonyme tournerait avec
 * n'importe quel ancêtre ouvert).
 */
export function Chevron({ open, className }: { open?: boolean; className?: string }) {
  return (
    <ChevronDown
      aria-hidden
      className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none', open && 'rotate-180', className)}
    />
  )
}

/** Bloc repliable natif : accessible, imprimable, sans dépendance. */
export function Disclosure({
  summary,
  children,
  defaultOpen,
  className,
  flat,
  plain,
}: {
  summary: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  /** Sur petit écran, sans cadre : un simple trait sous chaque bloc, le contenu prend toute la largeur. */
  flat?: boolean
  /** Sans cadre à toutes les largeurs : une ligne d'une liste à filets (le filet est celui de la liste). */
  plain?: boolean
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'group/disclosure',
        !plain && 'rounded-lg border bg-card',
        !plain && flat && 'max-sm:rounded-none max-sm:border-x-0 max-sm:border-t-0 max-sm:bg-transparent',
        className,
      )}
    >
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-2 p-3 text-sm font-medium [&::-webkit-details-marker]:hidden',
          flat && 'max-sm:px-0',
          plain && 'px-0 py-2.5 hover:text-primary',
        )}
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <Chevron className="group-open/disclosure:rotate-180" />
      </summary>
      <div className={cn('border-t p-3', flat && 'max-sm:border-t-0 max-sm:px-0 max-sm:pt-1', plain && 'border-t-0 px-0 pt-0 pb-3')}>{children}</div>
    </details>
  )
}

/**
 * Infobulle : s'ouvre au survol et au focus clavier. Elle complète un libellé,
 * elle ne le remplace jamais (sur écran tactile, elle ne s'affiche pas).
 */
/**
 * Une explication qui s'ouvre au survol, au clavier ET au toucher (une infobulle seule ne s'ouvre pas au doigt).
 * Un toucher ou Entrée ouvre et referme ; posée dans un résumé de motif, elle ne le déplie pas.
 */
export function Explain({ content, children }: { content: React.ReactNode; children: React.ReactElement }) {
  const [open, setOpen] = React.useState(false)
  const pointer = React.useRef('')
  const trigger = React.useRef<HTMLSpanElement>(null)
  const toggle = (e: React.SyntheticEvent) => {
    // preventDefault : ni le motif ne se déplie, ni la bulle ne se referme aussitôt (Radix ferme au clic).
    e.preventDefault()
    e.stopPropagation()
    // À la souris, le survol a déjà ouvert la bulle : le clic la garde ouverte au lieu de la refermer.
    setOpen((o) => (pointer.current === 'mouse' ? true : !o))
    pointer.current = ''
  }
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen}>
        <TooltipPrimitive.Trigger asChild>
          <span
            ref={trigger}
            role="button"
            tabIndex={0}
            className="cursor-help rounded focus-visible:outline-2 focus-visible:outline-ring"
            onPointerDown={(e) => {
              pointer.current = e.pointerType
              e.preventDefault()
            }}
            onClick={toggle}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(e)}
          >
            {children}
          </span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="bottom"
            sideOffset={6}
            collisionPadding={12}
            // Un toucher ailleurs ferme la bulle (Radix) ; sur l'étiquette elle-même, c'est le clic qui décide.
            onPointerDownOutside={(e) => trigger.current?.contains(e.target as Node) && e.preventDefault()}
            className="z-50 max-w-[min(20rem,calc(100vw-1.5rem))] rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-foreground shadow-lg"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

export function Tooltip({
  content,
  children,
  side = 'bottom',
  wide = false,
}: {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Bulle large, pour des citations. */
  wide?: boolean
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={250}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            collisionPadding={12}
            className={`z-50 ${wide ? 'max-h-[70vh] max-w-lg overflow-y-auto' : 'max-w-80'} rounded-md border bg-card px-3 py-2 text-sm leading-relaxed text-foreground shadow-lg`}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
}

/**
 * Menu déroulant : un bouton, une liste qui s'ouvre dessous. Se ferme au clic
 * ailleurs, avec Échap, ou après un choix. Un seul style pour tous les menus
 * (exporter, choisir un segment…).
 */
export function DropMenu({
  label,
  icon,
  children,
  align = 'right',
  ariaLabel,
  width = 'w-72',
  iconOnly = false,
  block = false,
}: {
  label: React.ReactNode
  /** Pleine largeur, comme un champ de formulaire. */
  block?: boolean
  /** Un bouton réduit à son icône (« ⋯ ») : le libellé sert alors de nom accessible. */
  iconOnly?: boolean
  icon?: React.ReactNode
  children: (close: () => void) => React.ReactNode
  align?: 'left' | 'right'
  ariaLabel?: string
  width?: string
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      {iconOnly ? (
        <Button type="button" variant="ghost" size="icon" aria-label={ariaLabel} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {icon}
        </Button>
      ) : (
        <Button
          // Dans un formulaire, ouvrir le menu ne doit jamais l'envoyer.
          type="button"
          variant="outline"
          size="sm"
          aria-label={ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={block ? 'h-10 w-full justify-between font-normal' : 'max-w-[16rem]'}
        >
          {icon}
          <span className={cn('truncate', block && 'flex-1 text-left')}>{label}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-60" />
        </Button>
      )}
      {open && (
        <div
          role="menu"
          className={cn(
            'z-40 mt-1 overflow-y-auto rounded-lg border bg-card p-1 shadow-lg',
            // Pleine largeur (dans un formulaire) : la liste s'ouvre dans le flux, jamais coupée par une fenêtre qui défile.
            block ? 'relative w-full' : cn('absolute max-h-[70vh]', width, align === 'right' ? 'right-0' : 'left-0'),
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

/** Titre d'une partie de menu. */
export function MenuSection({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>
}

/** Un choix de menu : libellé, explication facultative, icône ou coche. */
export function MenuItem({
  label,
  hint,
  icon,
  checked,
  onSelect,
  danger = false,
  disabled = false,
}: {
  label: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  checked?: boolean
  onSelect: () => void
  /** Action destructrice (supprimer) : en rouge. */
  danger?: boolean
  /** Visible mais impossible à choisir (la raison va dans `hint`). */
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role={checked === undefined ? 'menuitem' : 'menuitemradio'}
      aria-checked={checked}
      disabled={disabled}
      className={cn(
        'flex w-full cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-accent focus-visible:bg-accent focus-visible:outline-none',
        danger && 'text-negative hover:bg-negative/10',
        disabled && 'cursor-not-allowed opacity-60 hover:bg-transparent',
      )}
      onClick={onSelect}
    >
      <span className={cn('mt-0.5 flex size-4 shrink-0 items-center justify-center', danger ? 'text-negative' : 'text-muted-foreground')}>
        {checked ? <Check className="size-4 text-primary" /> : icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  )
}
