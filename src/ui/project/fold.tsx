import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { cn } from '../primitives'

/**
 * Lire un rapport long sans s'y perdre (`docs/LECTURE-RAPPORT.md`) : un bloc ouvert (grand thème, thème) garde son
 * en-tête collé en haut de l'écran tant qu'on le lit, avec « Replier » ; replier replace le titre là où était l'en-tête
 * et rend le focus au bloc. Les en-têtes se poussent comme des objets (`useHeadroom`) : le grand thème pousse la barre
 * de l'application, le thème qu'on lit pousse le grand thème ; en remontant, tout revient au même rythme.
 *
 * L'en-tête collé est la ligne fermée elle-même (titre, barre et indicateurs dessous, Arnaud, 18/10) : sa hauteur varie
 * avec le titre et l'écran, elle se mesure (`--theme-stick`, `--motif-stick`) pour que les en-têtes s'empilent sans se
 * chevaucher.
 */

/** Hauteur de la barre de l'application quand elle est visible ; les en-têtes collants se placent dessous. */
const APP_BAR_PX = 56
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

/** Ce qui est poussé hors de l'écran : la barre de l'application (`appOff`) et l'en-tête du grand thème (`themeOff`). */
let appOff = 0
let themeOff = 0

/** Le grand thème s'efface de `px` (`--theme-off`) ; les en-têtes qui collent dessous remontent d'autant. */
function setThemeOff(px: number) {
  themeOff = px
  document.documentElement.style.setProperty('--theme-off', `${px}px`)
}

/** La hauteur de l'en-tête ouvert du grand thème qui contient ce bloc (0 hors d'un grand thème). */
function themeHead(el: Element): number {
  const theme = el.parentElement?.closest('details[data-fold="theme"][open]')
  return (theme?.querySelector(':scope > summary') as HTMLElement | null)?.offsetHeight ?? 0
}

/**
 * Le thème ouvert dont l'en-tête est arrivé contre celui du grand thème : en descendant, il le pousse. Renvoie la
 * hauteur de l'en-tête du grand thème (ce qu'il peut pousser), ou 0.
 */
function readingMotif(): number {
  for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-fold="theme"][open] details[data-fold="motif"][open]')) {
    const head = themeHead(d)
    const line = barPx + head - themeOff
    const r = d.getBoundingClientRect()
    if (r.top <= line + 1 && r.bottom > line + 120) return head
  }
  return 0
}

/** Un grand thème ouvert dont l'en-tête est arrivé contre la barre de l'application : en descendant, il la pousse. */
function themeInContact(): boolean {
  for (const d of document.querySelectorAll<HTMLDetailsElement>('details[data-fold="theme"][open]')) {
    const r = d.getBoundingClientRect()
    if (r.top <= barPx + 1 && r.bottom > barPx + 120) return true
  }
  return false
}

/**
 * Les en-têtes se poussent comme des objets (Arnaud, 19/10) : un grand thème ouvert qui arrive contre la barre de
 * l'application la pousse hors de l'écran au rythme du défilement, pixel pour pixel ; une fois la barre sortie, le thème
 * qu'on lit pousse à son tour le grand thème. En remontant, tout revient au même rythme : le grand thème d'abord, puis la
 * barre. Rien n'apparaît ni ne disparaît d'un coup, rien n'est animé hors du défilement lui-même. La barre revient
 * entière dès qu'elle reçoit le focus clavier ; un défilement provoqué par le code (repli, saut) ne pousse rien.
 */
export function useHeadroom(enabled: boolean, header: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = document.documentElement
    const bar = header.current
    const apply = () => {
      barPx = APP_BAR_PX - appOff
      root.style.setProperty('--app-bar', `${barPx}px`)
      if (bar) bar.style.transform = appOff ? `translateY(${-appOff}px)` : ''
    }
    appOff = 0
    setThemeOff(0)
    apply()
    if (!enabled) return
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - last
      last = y
      if (!dy || Date.now() < frozenUntil) return
      if (dy > 0) {
        let rest = dy
        if (themeInContact()) {
          const push = Math.min(rest, APP_BAR_PX - appOff)
          appOff += push
          rest -= push
        }
        const head = rest > 0 && appOff >= APP_BAR_PX ? readingMotif() : 0
        if (head) setThemeOff(Math.min(head, themeOff + rest))
        // Le thème lu est fini (son en-tête est sorti) : le grand thème redescend avec le contenu.
        else if (themeOff && !readingMotif()) setThemeOff(Math.max(0, themeOff - dy))
      } else {
        let rest = -dy
        const back = Math.min(rest, themeOff)
        if (back) setThemeOff(themeOff - back)
        rest -= back
        appOff = Math.max(0, appOff - rest)
      }
      apply()
    }
    const onFocus = () => {
      appOff = 0
      apply()
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    bar?.addEventListener('focusin', onFocus)
    return () => {
      window.removeEventListener('scroll', onScroll)
      bar?.removeEventListener('focusin', onFocus)
      appOff = 0
      setThemeOff(0)
      apply()
    }
  }, [enabled, header])
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
  return barPx + themeHead(details)
}

/**
 * Referme un bloc ouvert. Si le lecteur est descendu dans le bloc (son en-tête est collé), le titre refermé vient se
 * placer là où était l'en-tête : le lecteur voit le bloc fermé et, dessous, le suivant. Le grand thème revient au-dessus
 * d'un thème refermé.
 */
export function foldDetails(details: HTMLDetailsElement) {
  const summary = details.querySelector(':scope > summary') as HTMLElement | null
  setThemeOff(0)
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

/**
 * Les classes d'un en-tête ouvert qui colle : sous la barre de l'application et sous l'en-tête du niveau supérieur.
 * Fond opaque, et aucune animation de position : une position animée se recalcule à chaque image et décroche l'en-tête
 * quand on défile vite (Arnaud, 19/10) ; seule la barre de l'application glisse, au-dessus d'eux, quand elle se cache.
 */
const STUCK = {
  theme:
    'sticky top-[calc(var(--app-bar)-var(--theme-off,0px))] z-20 border-b bg-background',
  motif:
    'sticky top-[calc(var(--app-bar)+var(--theme-stick,0px))] z-10 border-b bg-background',
}

/**
 * Un bloc repliable de lecture (grand thème, thème) : `<details>` natif (Ctrl+F l'ouvre, l'impression le déplie), dont
 * l'en-tête ouvert reste collé avec « Replier ». `row` est la ligne du bloc, une seule cible : fermée, elle ouvre ;
 * ouverte, elle colle telle quelle et replie. `level` place l'en-tête sous ceux des niveaux supérieurs.
 */
export function Fold({
  row,
  children,
  level,
  id,
  className,
  bodyClassName,
  defaultOpen = false,
  label,
  onToggle,
}: {
  row: ReactNode
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
  const head = useRef<HTMLElement>(null)
  const body = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(defaultOpen)
  // La hauteur de l'en-tête ouvert, pour que les en-têtes du niveau dessous collent juste sous lui.
  useEffect(() => {
    const h = head.current
    const b = body.current
    if (!open || !h || !b) return
    const measure = () =>
      level === 'theme'
        ? b.style.setProperty('--theme-stick', `calc(${h.offsetHeight}px - var(--theme-off, 0px))`)
        : b.style.setProperty('--motif-stick', `${h.offsetHeight}px`)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(h)
    return () => ro.disconnect()
  }, [open, level])
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
        ref={head}
        onClick={toggle}
        aria-label={open ? `Replier ${label}` : undefined}
        className={cn('flex cursor-pointer list-none items-center gap-2 select-none [&::-webkit-details-marker]:hidden', open && STUCK[level])}
      >
        <span className="min-w-0 flex-1">{row}</span>
        {/* « › » et « Replier » occupent la même place : rien ne glisse quand le bloc s'ouvre (designer-ui, 19/10). */}
        <span className="no-print flex w-24 shrink-0 justify-end max-sm:w-8">
          {open ? (
            <span className="flex min-h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground">
              <span aria-hidden>⌃</span> <span className="max-sm:hidden">Replier</span>
            </span>
          ) : (
            <span aria-hidden className="flex min-h-8 items-center px-2 text-muted-foreground">
              ›
            </span>
          )}
        </span>
      </summary>
      <div ref={body} className={bodyClassName}>
        {children}
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
  if (target instanceof HTMLDetailsElement) setThemeOff(0)
  window.scrollTo({ top: window.scrollY + r.top - goal, behavior: smooth ? 'smooth' : 'instant' })
  focus?.focus({ preventScroll: true })
  if (far && !reduced() && focus) {
    focus.classList.remove('fold-landed')
    void focus.offsetWidth
    focus.classList.add('fold-landed')
    window.setTimeout(() => focus.classList.remove('fold-landed'), 1200)
  }
}

/**
 * Replier un volet de verbatims : son intitulé (« ● 46 avis positifs ») glisse jusqu'à la pastille qui l'avait ouvert,
 * à l'endroit exact où elle était (Arnaud, 19/10 : le regard suit, même après un long défilement). `update` replie (et
 * doit rendre React d'un coup, `flushSync`) ; `to` renvoie la pastille d'arrivée. Sans transition de vue, ou si le
 * lecteur a demandé moins de mouvement, le volet se replie simplement.
 */
export function morphTo(from: HTMLElement | null, update: () => void, to: () => HTMLElement | null) {
  const start = (document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void>; finished: Promise<void> } }).startViewTransition
  if (!start || reduced() || !from) {
    update()
    to()
    return
  }
  let target: HTMLElement | null = null
  from.style.viewTransitionName = 'fold-chip'
  const t = start.call(document, () => {
    from.style.viewTransitionName = ''
    update()
    target = to()
    if (target) target.style.viewTransitionName = 'fold-chip'
  })
  t.ready.catch(() => {})
  t.finished.finally(() => {
    if (target) target.style.viewTransitionName = ''
  })
}

let seen: HTMLElement | null = null
/** La dernière pastille repliée garde un contour bleu léger : on sait ce qu'on vient de lire et de refermer. */
export function markSeen(el: HTMLElement) {
  if (seen && seen !== el) seen.classList.remove('chip-seen')
  seen = el
  el.classList.add('chip-seen')
}
