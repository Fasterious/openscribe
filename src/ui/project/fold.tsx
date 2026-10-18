import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../primitives'

/**
 * Lire un rapport long sans s'y perdre (`docs/LECTURE-RAPPORT.md`) : un bloc ouvert (thème, motif) garde son en-tête
 * collé en haut de l'écran tant qu'on le lit, avec « Replier » ; replier replace le titre là où était l'en-tête et rend
 * le focus au bloc. La barre de l'application se cache quand on descend, revient dès qu'on remonte.
 *
 * Hauteurs fixes, pour que les en-têtes s'empilent sans se chevaucher : thème ouvert 3 rem, motif ouvert 2,75 rem.
 * Sur un écran bas (moins de 600 px, téléphone couché) ou étroit, le thème ne colle pas : un seul niveau collé.
 */

/** Hauteur de la barre de l'application quand elle est visible ; les en-têtes collants se placent dessous. */
const APP_BAR = '3.5rem'
let frozenUntil = 0
/** Le dernier repli : le second clic d'un double clic sur « Replier » ne rouvre pas le bloc dont le titre arrive sous le pointeur. */
let folded: { at: number; el: HTMLDetailsElement | null } = { at: 0, el: null }
/** La dernière ouverture : le second clic d'un double clic sur une ligne fermée ne referme pas le bloc qu'il vient d'ouvrir. */
let unfolded: { at: number; el: HTMLDetailsElement | null } = { at: 0, el: null }

/** Un défilement provoqué par le code (un repli) ne fait pas réapparaître la barre de l'application. */
export function freezeHeadroom(ms = 400) {
  frozenUntil = Date.now() + ms
}

/**
 * La barre de l'application, partiellement persistante sur les pages de lecture : cachée quand on descend de plus de
 * 8 px au-delà des 200 premiers pixels, revenue dès qu'on remonte de 8 px, ou dès qu'elle reçoit le focus clavier.
 * Elle écrit sa hauteur visible dans `--app-bar`, que suivent les en-têtes collants.
 */
export function useHeadroom(enabled: boolean, header: React.RefObject<HTMLElement | null>) {
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    if (!enabled) {
      setHidden(false)
      root.style.setProperty('--app-bar', APP_BAR)
      return
    }
    // `anchor` : là où le sens du défilement a changé ; la barre bouge après 8 px dans le nouveau sens.
    let last = window.scrollY
    let anchor = last
    let dir = 0
    const onScroll = () => {
      const y = window.scrollY
      if (Date.now() < frozenUntil) {
        last = anchor = y
        return
      }
      const d = Math.sign(y - last)
      if (d && d !== dir) {
        anchor = last
        dir = d
      }
      if (y < 200 || header.current?.contains(document.activeElement)) setHidden(false)
      else if (dir > 0 && y - anchor > 8) setHidden(true)
      else if (dir < 0 && anchor - y > 8) setHidden(false)
      last = y
    }
    const onFocus = () => setHidden(false)
    const bar = header.current
    window.addEventListener('scroll', onScroll, { passive: true })
    bar?.addEventListener('focusin', onFocus)
    return () => {
      window.removeEventListener('scroll', onScroll)
      bar?.removeEventListener('focusin', onFocus)
    }
  }, [enabled, header])
  useEffect(() => {
    document.documentElement.style.setProperty('--app-bar', hidden ? '0px' : APP_BAR)
  }, [hidden])
  return hidden
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Ouvre ou ferme sans animation (les blocs ouverts par le code, les très grands blocs). */
function instant(details: HTMLDetailsElement) {
  details.classList.add('fold-instant')
  window.setTimeout(() => details.classList.remove('fold-instant'), 300)
}

/**
 * Referme un bloc ouvert. Si le lecteur est descendu dans le bloc (son en-tête est collé), le titre refermé vient se
 * placer là où était l'en-tête : le lecteur voit le bloc fermé et, dessous, le suivant. Un grand bloc se referme sans
 * animer des milliers de pixels.
 */
export function foldDetails(details: HTMLDetailsElement) {
  const summary = details.querySelector(':scope > summary') as HTMLElement | null
  // Un en-tête qui ne colle pas (le thème, sur mobile) : le titre vient sous la barre de l'application, si elle est là.
  const style = summary ? getComputedStyle(summary) : null
  const stick =
    style?.position === 'sticky' ? parseFloat(style.top) || 0 : Math.max(0, document.querySelector('body header')?.getBoundingClientRect().bottom ?? 0)
  const r = details.getBoundingClientRect()
  freezeHeadroom()
  folded = { at: Date.now(), el: details }
  if (r.height > window.innerHeight * 1.5 || reduced()) instant(details)
  const inside = r.top < stick
  // L'ancrage du défilement du navigateur décalerait la page quand le bloc se referme : on le suspend le temps du repli.
  const root = document.documentElement
  root.style.overflowAnchor = 'none'
  if (inside) window.scrollBy({ top: r.top - stick, behavior: 'instant' })
  details.open = false
  summary?.focus({ preventScroll: true })
  const settle = () => {
    const drift = details.getBoundingClientRect().top - stick
    if (inside && Math.abs(drift) > 1) window.scrollBy({ top: drift, behavior: 'instant' })
  }
  requestAnimationFrame(settle)
  window.setTimeout(() => {
    settle()
    root.style.overflowAnchor = ''
  }, 260)
}

/** Les classes d'un en-tête ouvert qui colle : sous la barre de l'application et sous l'en-tête du niveau supérieur. */
const STUCK = {
  // Le thème ne colle que sur un écran assez large et assez haut : sur mobile, deux niveaux collés au plus.
  theme:
    'z-20 h-12 border-b bg-background/95 backdrop-blur transition-[top] duration-200 motion-reduce:transition-none [@media(min-width:40rem)_and_(min-height:600px)]:sticky [@media(min-width:40rem)_and_(min-height:600px)]:top-[var(--app-bar)]',
  motif:
    'sticky top-[calc(var(--app-bar)+var(--theme-stick,0px))] z-10 h-11 border-b bg-background/95 backdrop-blur transition-[top] duration-200 motion-reduce:transition-none',
}

/**
 * Un bloc repliable de lecture (thème, motif) : `<details>` natif (Ctrl+F l'ouvre, l'impression le déplie), dont
 * l'en-tête ouvert reste collé avec « Replier ». `closed` est la ligne fermée, une seule cible qui ouvre ; `opened`
 * l'en-tête compact du bloc ouvert, sur une ligne. `level` place l'en-tête sous ceux des niveaux supérieurs.
 */
export function Fold({
  closed,
  opened,
  children,
  level,
  id,
  className,
  bodyClassName,
  defaultOpen = false,
  label,
  onToggle,
}: {
  closed: ReactNode
  opened: ReactNode
  children: ReactNode
  level: 'theme' | 'motif'
  id?: string
  className?: string
  bodyClassName?: string
  defaultOpen?: boolean
  /** Nom du bloc pour les lecteurs d'écran (« le thème Public face au privé »). */
  label: string
  onToggle?: (open: boolean) => void
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(defaultOpen)
  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const d = ref.current
    if (!d) return
    const second = e.detail > 1
    if (d.open) {
      if (!(second && unfolded.el === d && Date.now() - unfolded.at < 500)) foldDetails(d)
    } else if (!(second && folded.el === d && Date.now() - folded.at < 500)) {
      unfolded = { at: Date.now(), el: d }
      d.open = true
    }
  }, [])
  return (
    <details
      ref={ref}
      id={id}
      open={defaultOpen}
      data-fold={level}
      onToggle={(e) => {
        const isOpen = (e.currentTarget as HTMLDetailsElement).open
        setOpen(isOpen)
        onToggle?.(isOpen)
      }}
      // Échap replie le bloc ouvert le plus intérieur (le plus proche du focus) et rend le focus à son titre.
      onKeyDown={(e) => {
        if (e.key !== 'Escape' || !ref.current?.open) return
        e.stopPropagation()
        foldDetails(ref.current)
      }}
      className={cn('fold group/fold', className)}
    >
      <summary
        onClick={toggle}
        aria-label={open ? `Replier ${label}` : undefined}
        className={cn('flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden', open && STUCK[level])}
      >
        <span className="min-w-0 flex-1">{open ? opened : closed}</span>
        {open ? (
          <span className="no-print flex min-h-8 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <span aria-hidden>⌃</span> Replier
          </span>
        ) : (
          <span aria-hidden className="shrink-0 text-muted-foreground">
            ›
          </span>
        )}
      </summary>
      <div
        className={cn(
          // Les en-têtes des motifs collent sous celui du thème, quand celui-ci colle (même condition que STUCK.theme).
          level === 'theme' && '[--theme-stick:0px] [@media(min-width:40rem)_and_(min-height:600px)]:[--theme-stick:3rem]',
          level === 'motif' && '[--motif-stick:2.75rem]',
          bodyClassName,
        )}
      >
        {children}
        <button
          type="button"
          onClick={() => ref.current && foldDetails(ref.current)}
          className="no-print mt-3 inline-flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <span aria-hidden>⌃</span> Replier {label}
        </button>
      </div>
    </details>
  )
}

/**
 * Ouvre un motif dans la partie détaillée (et son thème), sans animation (le contenu doit être rendu pour qu'on y
 * défile), l'amène sous les en-têtes collants et lui donne le focus : depuis une liste ou le résumé, on va lire le
 * motif en entier. Renvoie le bloc ouvert.
 */
export function revealMotif(groupId: string): HTMLDetailsElement | null {
  const d = document.getElementById(`motif-${groupId}`) as HTMLDetailsElement | null
  if (!d) return null
  for (let p: HTMLElement | null = d; p; p = p.parentElement)
    if (p instanceof HTMLDetailsElement && !p.open) {
      instant(p)
      p.open = true
    }
  freezeHeadroom(1200)
  const summary = d.querySelector(':scope > summary') as HTMLElement | null
  // Deux images : le temps que le contenu ouvert soit mis en page.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      d.scrollIntoView({ block: 'start' })
      summary?.focus({ preventScroll: true })
    }),
  )
  return d
}
