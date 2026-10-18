import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '../primitives'

/**
 * Lire un rapport long sans s'y perdre (`docs/LECTURE-RAPPORT.md`) : un bloc ouvert (grand thème, thème) garde son
 * en-tête collé en haut de l'écran tant qu'on le lit, avec « Replier » ; replier replace le titre là où était l'en-tête
 * et rend le focus au bloc. La barre de l'application se cache quand on descend, revient dès qu'on remonte.
 *
 * Le grand thème ouvert reste collé tant qu'on lit ses thèmes fermés : il est prioritaire. Quand on lit un thème ouvert
 * et qu'on descend, il s'efface avec la barre de l'application, le thème prend sa place ; il revient avec elle dès
 * qu'on remonte (remarque d'Arnaud, 18/10). Sur un écran bas, il s'efface dès qu'on lit un thème ouvert.
 *
 * Hauteurs fixes, pour que les en-têtes s'empilent sans se chevaucher : grand thème 3 rem, thème 2,75 rem.
 */

/** Hauteur de la barre de l'application quand elle est visible ; les en-têtes collants se placent dessous. */
const APP_BAR = '3.5rem'
const APP_BAR_PX = 56
const THEME_PX = 48
let barPx = APP_BAR_PX
let frozenUntil = 0
/** Le dernier repli : le second clic d'un double clic sur « Replier » ne rouvre pas le bloc dont le titre arrive sous le pointeur. */
let folded: { at: number; el: HTMLDetailsElement | null } = { at: 0, el: null }
/** La dernière ouverture : le second clic d'un double clic sur une ligne fermée ne referme pas le bloc qu'il vient d'ouvrir. */
let unfolded: { at: number; el: HTMLDetailsElement | null } = { at: 0, el: null }

/** Un défilement provoqué par le code (un repli) ne fait pas réapparaître la barre de l'application. */
export function freezeHeadroom(ms = 400) {
  frozenUntil = Date.now() + ms
}

/** Le grand thème s'efface (`--theme-off`) ; les en-têtes qui collent dessous remontent d'autant. */
function setThemeOff(off: boolean) {
  document.documentElement.style.setProperty('--theme-off', off ? `${THEME_PX}px` : '0px')
}

/** Le lecteur est dans un thème ouvert d'un grand thème : l'en-tête du thème est collé, son contenu occupe l'écran. */
function readingMotif(): boolean {
  const line = barPx + THEME_PX + 4
  for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-fold="theme"][open] details[data-fold="motif"][open]')) {
    const r = d.getBoundingClientRect()
    if (r.top < line && r.bottom > line + 120) return true
  }
  return false
}

/**
 * La barre de l'application, partiellement persistante sur les pages de lecture : cachée quand on descend de plus de
 * 8 px au-delà des 200 premiers pixels, revenue dès qu'on remonte de 8 px, ou dès qu'elle reçoit le focus clavier.
 * Elle écrit sa hauteur visible dans `--app-bar`, que suivent les en-têtes collants ; le grand thème s'efface avec elle
 * quand on lit un thème ouvert.
 */
export function useHeadroom(enabled: boolean, header: React.RefObject<HTMLElement | null>) {
  const [hidden, setHidden] = useState(false)
  const hiddenRef = useRef(false)
  useEffect(() => {
    const root = document.documentElement
    // La hauteur de la barre s'écrit tout de suite, avant que le grand thème ne s'efface : jamais l'un sous l'autre.
    const hide = (h: boolean) => {
      hiddenRef.current = h
      barPx = h ? 0 : APP_BAR_PX
      root.style.setProperty('--app-bar', h ? '0px' : APP_BAR)
      setHidden(h)
    }
    if (!enabled) {
      hide(false)
      root.style.setProperty('--app-bar', APP_BAR)
      setThemeOff(false)
      return
    }
    // `anchor` : là où le sens du défilement a changé ; la barre bouge après 8 px dans le nouveau sens.
    let last = window.scrollY
    let anchor = last
    let dir = 0
    const deep = () => setThemeOff(readingMotif() && (hiddenRef.current || window.innerHeight < 600))
    const onScroll = () => {
      const y = window.scrollY
      if (Date.now() < frozenUntil) {
        last = anchor = y
        deep()
        return
      }
      const d = Math.sign(y - last)
      if (d && d !== dir) {
        anchor = last
        dir = d
      }
      if (y < 200 || header.current?.contains(document.activeElement)) hide(false)
      else if (dir > 0 && y - anchor > 8) hide(true)
      else if (dir < 0 && anchor - y > 8) hide(false)
      last = y
      deep()
    }
    const onFocus = () => hide(false)
    const bar = header.current
    window.addEventListener('scroll', onScroll, { passive: true })
    // Un bloc ouvert ou fermé change ce qu'on lit : le grand thème revient quand on referme un thème.
    document.addEventListener('toggle', deep, true)
    bar?.addEventListener('focusin', onFocus)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('toggle', deep, true)
      bar?.removeEventListener('focusin', onFocus)
      setThemeOff(false)
    }
  }, [enabled, header])
  useEffect(() => {
    barPx = hidden ? 0 : APP_BAR_PX
    document.documentElement.style.setProperty('--app-bar', hidden ? '0px' : APP_BAR)
    if (!hidden) setThemeOff(window.innerHeight < 600 && readingMotif())
  }, [hidden])
  return hidden
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Ouvre ou ferme sans animation (les blocs ouverts par le code, les très grands blocs). */
function instant(details: HTMLDetailsElement) {
  details.classList.add('fold-instant')
  window.setTimeout(() => details.classList.remove('fold-instant'), 300)
}

/** L'état React de chaque bloc, mis à jour d'un coup pendant une transition (l'événement `toggle` arrive trop tard). */
const setters = new WeakMap<HTMLDetailsElement, (open: boolean) => void>()

/**
 * Ouvre ou ferme un bloc en transition de vue : la barre et le titre de la ligne glissent jusqu'à leur place dans
 * l'en-tête (et inversement) ; au repli, le contenu se range vers le titre, le bloc suivant apparaît dessous
 * (`index.css`, `vt-open` et `vt-fold`). Sans transition de vue, ou si le lecteur a demandé moins de mouvement, le
 * bloc s'ouvre ou se ferme comme avant.
 */
function transition(details: HTMLDetailsElement, kind: 'open' | 'fold', update: () => void, line = 0) {
  const start = (document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }).startViewTransition
  if (!start || reduced()) {
    update()
    return false
  }
  const root = document.documentElement
  details.classList.add('vt-active')
  root.classList.add(`vt-${kind}`)
  root.style.setProperty('--fold-line', `${Math.max(0, Math.round(line))}px`)
  const t = start.call(document, () => {
    update()
    setters.get(details)?.(details.open)
  })
  // Une transition sautée (bloc hors de l'écran, onglet caché) rejette `ready` : le bloc est ouvert quand même.
  ;(t as unknown as { ready: Promise<void> }).ready.catch(() => {})
  t.finished.finally(() => {
    details.classList.remove('vt-active')
    root.classList.remove(`vt-${kind}`)
  })
  return true
}

/** Où se place le titre d'un bloc collé : sous la barre de l'application, et sous le grand thème pour un thème. */
function stickLine(details: HTMLDetailsElement): number {
  if (details.dataset.fold === 'theme') return barPx
  return barPx + (details.parentElement?.closest('details[data-fold="theme"]') ? THEME_PX : 0)
}

/**
 * Referme un bloc ouvert. Si le lecteur est descendu dans le bloc (son en-tête est collé), le titre refermé vient se
 * placer là où était l'en-tête : le lecteur voit le bloc fermé et, dessous, le suivant. Le grand thème revient au-dessus
 * d'un thème refermé.
 */
export function foldDetails(details: HTMLDetailsElement) {
  const summary = details.querySelector(':scope > summary') as HTMLElement | null
  setThemeOff(false)
  const stick = stickLine(details)
  const r = details.getBoundingClientRect()
  freezeHeadroom()
  folded = { at: Date.now(), el: details }
  const inside = r.top < stick + 1
  // L'ancrage du défilement du navigateur décalerait la page quand le bloc se referme : on le suspend le temps du repli.
  const root = document.documentElement
  root.style.overflowAnchor = 'none'
  let done = false
  const settle = () => {
    if (!done) return
    const drift = details.getBoundingClientRect().top - stick
    if (inside && Math.abs(drift) > 1) window.scrollBy({ top: drift, behavior: 'instant' })
  }
  const close = () => {
    if (inside) window.scrollBy({ top: r.top - stick, behavior: 'instant' })
    details.open = false
    done = true
    summary?.focus({ preventScroll: true })
    settle()
  }
  // En transition de vue, le contenu se range par l'image : le bloc se ferme d'un coup dessous. Sinon, un grand bloc se
  // referme sans animer des milliers de pixels.
  const top = inside ? stick : r.top
  const height = summary?.getBoundingClientRect().height ?? 0
  if (r.height > window.innerHeight * 1.5 || reduced() || 'startViewTransition' in document) instant(details)
  transition(details, 'fold', close, top + height)
  requestAnimationFrame(settle)
  window.setTimeout(() => {
    settle()
    root.style.overflowAnchor = ''
  }, 300)
}

/** Les classes d'un en-tête ouvert qui colle : sous la barre de l'application et sous l'en-tête du niveau supérieur. */
const STUCK = {
  theme:
    'sticky top-[calc(var(--app-bar)-var(--theme-off,0px))] z-20 h-12 border-b bg-background/95 backdrop-blur transition-[top] duration-200 motion-reduce:transition-none',
  motif:
    'sticky top-[calc(var(--app-bar)+var(--theme-stick,0px))] z-10 h-11 border-b bg-background/95 backdrop-blur transition-[top] duration-200 motion-reduce:transition-none',
}

/**
 * Un bloc repliable de lecture (grand thème, thème) : `<details>` natif (Ctrl+F l'ouvre, l'impression le déplie), dont
 * l'en-tête ouvert reste collé avec « Replier ». `closed` est la ligne fermée, une seule cible qui ouvre ; `opened`
 * l'en-tête compact du bloc ouvert, sur une ligne. `level` place l'en-tête sous ceux des niveaux supérieurs.
 * Le titre et la barre portent `data-vt="title"` et `data-vt="bar"` dans les deux : ils glissent de l'un à l'autre.
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
  /** Nom du bloc pour les lecteurs d'écran (« le grand thème Public face au privé »). */
  label: string
  onToggle?: (open: boolean) => void
}) {
  const ref = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    setters.set(d, (v) => flushSync(() => setOpen(v)))
    return () => void setters.delete(d)
  }, [])
  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const d = ref.current
    if (!d) return
    const second = e.detail > 1
    if (d.open) {
      if (!(second && unfolded.el === d && Date.now() - unfolded.at < 500)) foldDetails(d)
    } else if (!(second && folded.el === d && Date.now() - folded.at < 500)) {
      unfolded = { at: Date.now(), el: d }
      // Un titre qui devient collé n'est plus un repère pour l'ancrage du défilement : le navigateur prendrait le bloc
      // suivant et sauterait de toute la hauteur du contenu ouvert (passe testeur du 18/10). On le suspend le temps d'ouvrir.
      const root = document.documentElement
      root.style.overflowAnchor = 'none'
      transition(d, 'open', () => {
        d.open = true
      })
      window.setTimeout(() => (root.style.overflowAnchor = ''), 400)
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
        className={cn('flex cursor-pointer list-none items-center gap-2 select-none [&::-webkit-details-marker]:hidden', open && STUCK[level])}
      >
        <span className="min-w-0 flex-1">{open ? opened : closed}</span>
        {open ? (
          <span className="no-print flex min-h-8 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
            <span aria-hidden>⌃</span> <span className="max-sm:hidden">Replier</span>
          </span>
        ) : (
          <span aria-hidden className="shrink-0 text-muted-foreground">
            ›
          </span>
        )}
      </summary>
      <div
        className={cn(
          // Les en-têtes des thèmes collent sous celui du grand thème, et remontent quand il s'efface.
          level === 'theme' && '[--theme-stick:calc(3rem-var(--theme-off,0px))]',
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
 * Ouvre un thème dans la partie détaillée (et son grand thème), sans animation (le contenu doit être rendu pour qu'on y
 * défile), l'amène sous les en-têtes collants et lui donne le focus : depuis une liste ou le résumé, on va lire le
 * thème en entier. Renvoie le bloc ouvert.
 */
export function revealMotif(groupId: string): HTMLDetailsElement | null {
  const d = document.getElementById(`motif-${groupId}`) as HTMLDetailsElement | null
  if (!d) return null
  for (let p: HTMLElement | null = d; p; p = p.parentElement)
    if (p instanceof HTMLDetailsElement && !p.open) {
      instant(p)
      p.open = true
    }
  const summary = d.querySelector(':scope > summary') as HTMLElement | null
  // Deux images : le temps que le contenu ouvert soit mis en page.
  requestAnimationFrame(() => requestAnimationFrame(() => glideTo(d, 'start', summary)))
  return d
}

/**
 * Amène un élément à l'écran et lui donne le focus. Un saut court (moins d'un écran et demi) défile en douceur : on voit
 * où l'on va. Un saut long arrive d'un coup (huit écrans de défilement donnent le tournis), puis le titre d'arrivée
 * s'éclaire un instant pour qu'on voie où l'on a atterri. Sans mouvement si le lecteur l'a demandé.
 */
export function glideTo(target: HTMLElement, block: 'start' | 'center', focus: HTMLElement | null = target) {
  const r = target.getBoundingClientRect()
  // Un bloc arrive juste sous les en-têtes collés tels qu'ils seront (la barre de l'application ne bouge pas pendant le saut).
  const goal = block === 'start' ? (target instanceof HTMLDetailsElement ? stickLine(target) : barPx) : window.innerHeight / 2 - r.height / 2
  const far = Math.abs(r.top - goal) > window.innerHeight * 1.5
  const smooth = !far && !reduced()
  freezeHeadroom(smooth ? 1500 : 600)
  if (target instanceof HTMLDetailsElement) setThemeOff(false)
  window.scrollTo({ top: window.scrollY + r.top - goal, behavior: smooth ? 'smooth' : 'instant' })
  focus?.focus({ preventScroll: true })
  if (far && !reduced() && focus) {
    focus.classList.remove('fold-landed')
    void focus.offsetWidth
    focus.classList.add('fold-landed')
    window.setTimeout(() => focus.classList.remove('fold-landed'), 1200)
  }
}
