import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../primitives'

/**
 * Lire un rapport long sans s'y perdre (`docs/LECTURE-RAPPORT.md`) : un bloc ouvert (thème, motif) garde son en-tête
 * collé en haut de l'écran tant qu'on le lit, avec « Replier » ; replier replace le titre là où était l'en-tête et rend
 * le focus au bloc. La barre de l'application se cache quand on descend, revient dès qu'on remonte.
 */

/** Hauteur de la barre de l'application quand elle est visible ; les en-têtes collants se placent dessous. */
const APP_BAR = '3.5rem'
let frozenUntil = 0

/** Un défilement provoqué par le code (un repli) ne fait pas réapparaître la barre de l'application. */
export function freezeHeadroom(ms = 400) {
  frozenUntil = Date.now() + ms
}

/**
 * La barre de l'application, partiellement persistante sur les pages de lecture : cachée quand on descend de plus de
 * 8 px au-delà des 200 premiers pixels, revenue dès qu'on remonte de 8 px, toujours visible si elle a le focus.
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
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [enabled, header])
  useEffect(() => {
    document.documentElement.style.setProperty('--app-bar', hidden ? '0px' : APP_BAR)
  }, [hidden])
  return hidden
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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
  if (r.height > window.innerHeight * 1.5 || reduced()) {
    details.classList.add('fold-instant')
    window.setTimeout(() => details.classList.remove('fold-instant'), 300)
  }
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

/**
 * Un bloc repliable de lecture (thème, motif) : `<details>` natif (Ctrl+F l'ouvre, l'impression le déplie), dont
 * l'en-tête ouvert reste collé avec « Replier ». `closed` est la ligne fermée, une seule cible qui ouvre ; `opened`
 * l'en-tête compact du bloc ouvert. `level` place l'en-tête sous ceux des niveaux supérieurs.
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
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(defaultOpen)
  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const d = ref.current
    if (!d) return
    if (d.open) foldDetails(d)
    else d.open = true
  }, [])
  return (
    <details
      ref={ref}
      id={id}
      open={defaultOpen}
      data-fold={level}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
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
        className={cn(
          'flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden',
          // Ouvert, l'en-tête colle sous la barre de l'application et sous l'en-tête du niveau supérieur.
          open &&
            (level === 'theme'
              ? 'z-20 border-b bg-background/95 backdrop-blur transition-[top] duration-200 sm:sticky sm:top-[var(--app-bar)]'
              : 'sticky top-[calc(var(--app-bar)+var(--theme-stick,0px))] z-10 border-b bg-background/95 backdrop-blur transition-[top] duration-200'),
        )}
      >
        <span className="min-w-0 flex-1">{open ? opened : closed}</span>
        {open ? (
          <span className="flex min-h-8 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
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
          // Les en-têtes des motifs collent sous celui du thème (sur grand écran : sur mobile, deux niveaux au plus).
          level === 'theme' && '[--theme-stick:0px] sm:[--theme-stick:3rem]',
          level === 'motif' && '[--motif-stick:3rem]',
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
