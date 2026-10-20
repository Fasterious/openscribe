import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../primitives'

/**
 * Lire un rapport long sans s'y perdre (`docs/LECTURE-RAPPORT.md`) : un bloc ouvert (grand thème, thème) garde son
 * en-tête collé en haut de l'écran tant qu'on le lit, avec « Replier » ; replier replace le titre là où était l'en-tête
 * et rend le focus au bloc. Les en-têtes se poussent comme des objets (`useHeadroom`) : le grand thème pousse la barre
 * de l'application, le thème qu'on lit pousse le grand thème ; en remontant, tout revient au même rythme.
 *
 * L'en-tête collé est la ligne fermée elle-même (titre, barre et indicateurs dessous, Arnaud, 18/10) : sa hauteur varie
 * avec le titre et l'écran, elle se mesure (`placeStuck`) pour que les en-têtes s'empilent sans se chevaucher.
 */

/** Hauteur de la barre de l'application, bordure comprise (mesurée) ; `barPx` : ce qui en reste à l'écran. */
let barFull = 57
let barPx = barFull
let frozenUntil = 0
/** Le dernier repli : le second clic d'un double clic sur « Replier » ne rouvre pas le bloc dont le titre arrive sous le pointeur. */
let folded: { at: number; el: HTMLDetailsElement | null } = { at: 0, el: null }
/** La dernière ouverture : le second clic d'un double clic sur une ligne fermée ne referme pas le bloc qu'il vient d'ouvrir. */
let unfolded: { at: number; el: HTMLDetailsElement | null } = { at: 0, el: null }

/** Un défilement provoqué par le code (un repli) ne fait pas réapparaître la barre de l'application. */
export function freezeHeadroom(ms = 400) {
  frozenUntil = Math.max(frozenUntil, Date.now() + ms)
}

/**
 * Pendant une transition de vue, le défilement du code peut arriver bien après le clic (jusqu'à 1,5 s mesurées) : on
 * gèle jusqu'à la fin réelle de la transition, plus une marge, plutôt qu'un délai fixe (passe testeur du 19/10).
 */
let holds = 0
function holdUntil(done: Promise<unknown>) {
  holds++
  done.finally(() => {
    holds--
    freezeHeadroom(200)
  })
}
const frozen = () => holds > 0 || Date.now() < frozenUntil

/**
 * Ce qui est poussé hors de l'écran : la barre de l'application (`appOff`) et l'en-tête du grand thème `themeEl`
 * (`themeOff`). Chaque en-tête collé reçoit sa position directement (`placeStuck`) : changer une variable sur la racine
 * recalculerait les styles de toute la page à chaque image (8,8 ms mesurées sur ordinateur, designer-ui, 19/10).
 */
let appOff = 0
let themeOff = 0
let themeEl: HTMLDetailsElement | null = null
let header: HTMLElement | null = null

const headOf = (d: Element | null | undefined) => (d?.querySelector(':scope > summary') as HTMLElement | null)?.offsetHeight ?? 0
const parentTheme = (el: Element) => el.parentElement?.closest('details[data-fold="theme"][open]') as HTMLDetailsElement | null

/** La hauteur de l'en-tête ouvert du grand thème qui contient ce bloc (0 hors d'un grand thème). */
function themeHead(el: Element): number {
  return headOf(parentTheme(el))
}

/** Le haut d'un en-tête de grand thème collé, compte tenu de ce qui a été poussé. */
const themeTop = (t: HTMLDetailsElement) => barPx - (t === themeEl ? themeOff : 0)

/** Place les en-têtes collés ouverts (grands thèmes, thèmes, volets de verbatims) et la marge de défilement. */
export function placeStuck() {
  barPx = barFull - appOff
  if (header) header.style.transform = appOff ? `translateY(${-appOff}px)` : ''
  let stack = barPx
  for (const t of document.querySelectorAll<HTMLDetailsElement>('details[data-fold="theme"][open]')) {
    const s = t.querySelector(':scope > summary') as HTMLElement | null
    if (s) s.style.top = `${themeTop(t)}px`
  }
  for (const m of document.querySelectorAll<HTMLDetailsElement>('details[data-fold="motif"][open]')) {
    const t = parentTheme(m)
    const s = m.querySelector(':scope > summary') as HTMLElement | null
    if (s) s.style.top = `${t ? themeTop(t) + headOf(t) : barPx}px`
  }
  for (const p of document.querySelectorAll<HTMLElement>('[data-stick-panel]')) {
    const t = p.closest('details[data-fold="theme"][open]') as HTMLDetailsElement | null
    const m = p.closest('details[data-fold="motif"][open]')
    const top = (t ? themeTop(t) + headOf(t) : barPx) + headOf(m)
    p.style.top = `${top}px`
  }
  // La marge de défilement suit la pile collée : un élément qui reçoit le focus ne finit pas dessous (WCAG 2.4.11).
  if (themeEl) stack = themeTop(themeEl) + headOf(themeEl)
  const reading = themeEl && [...themeEl.querySelectorAll<HTMLDetailsElement>('details[data-fold="motif"][open]')].find((m) => {
    const r = m.getBoundingClientRect()
    return r.top < stack && r.bottom > stack
  })
  document.documentElement.style.scrollPaddingTop = `${Math.max(0, stack + headOf(reading)) + 8}px`
}

/** Le grand thème rendu entier (un repli, un saut) : la pile collée reprend sa place. */
function resetThemeOff() {
  themeOff = 0
  placeStuck()
}

/**
 * Combien la pile doit être poussée, d'après la position réelle des blocs (pas la somme des défilements, qui laissait
 * des trous au contact) : le grand thème dont le haut a dépassé la barre la pousse d'autant ; le thème ouvert qui
 * arrive sous lui pousse barre et grand thème ensemble.
 */
function needed(): { theme: HTMLDetailsElement | null; app: number; motif: number; head: number } {
  for (const t of document.querySelectorAll<HTMLDetailsElement>('details[data-fold="theme"][open]')) {
    const r = t.getBoundingClientRect()
    if (r.top > barFull || r.bottom <= 0) continue
    const head = headOf(t)
    // Le grand thème ne pousse que la barre ; seul le thème lu pousse le grand thème (passe du 19/10 : le grand thème
    // s'effaçait alors que le thème ouvert était encore 300 px plus bas).
    let motif = 0
    for (const m of t.querySelectorAll<HTMLDetailsElement>('details[data-fold="motif"][open]')) {
      const mr = m.getBoundingClientRect()
      // Le thème touche le grand thème (2 px : la marge haute de sa ligne) et n'est pas encore sorti de l'écran.
      if (mr.bottom > 0) motif = Math.max(motif, barFull + head - (mr.top + 2))
    }
    return { theme: t, app: Math.min(barFull, Math.max(0, barFull - r.top)), motif: Math.max(0, motif), head }
  }
  return { theme: null, app: 0, motif: 0, head: 0 }
}

/**
 * Les en-têtes se poussent comme des objets (Arnaud, 19/10) : en descendant, la barre de l'application sort de l'écran
 * au rythme du défilement (et un grand thème ouvert collé la suit) ; le thème qu'on lit pousse à son tour le grand thème (et la
 * barre, si elle est encore là). En descendant, rien ne revient ; en remontant, tout revient au même rythme : le grand
 * thème d'abord, puis la barre. Rien n'est animé hors du défilement lui-même. La barre revient entière dès qu'elle reçoit
 * le focus clavier ; un défilement provoqué par le code (repli, saut) ne pousse rien.
 */
export function useHeadroom(enabled: boolean, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    header = ref.current
    barFull = header?.offsetHeight || barFull
    appOff = 0
    themeOff = 0
    themeEl = null
    placeStuck()
    if (!enabled) return
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const dy = y - last
      last = y
      if (!dy || frozen()) return placeStuck()
      const n = needed()
      if (n.theme !== themeEl) {
        // Un autre grand thème (ou aucun) : le précédent n'est plus à l'écran, il n'a plus rien de poussé.
        themeEl = n.theme
        themeOff = 0
      }
      if (dy > 0) {
        // On repousse au rythme du défilement, jamais d'un coup : après une remontée, la barre (puis le grand thème) se
        // recache pixel pour pixel (Arnaud, 20/10), sans dépasser ce que la position réelle des blocs demande.
        let rest = dy
        // Pendant la lecture, la barre sort de l'écran au rythme du défilement, partout (Arnaud, 20/10 : la lecture n'est
        // pas encombrée) ; elle revient en remontant. Tout en haut de la page, elle reste entière.
        const wantApp = Math.min(barFull, Math.max(y, n.app, n.motif))
        const pushApp = Math.min(rest, Math.max(0, wantApp - appOff))
        appOff += pushApp
        rest -= pushApp
        const wantTheme = Math.max(0, Math.min(n.head, n.motif - barFull))
        themeOff += Math.min(rest, Math.max(0, wantTheme - themeOff))
      } else {
        let rest = -dy
        const back = Math.min(rest, themeOff)
        themeOff -= back
        rest -= back
        appOff = Math.max(0, appOff - rest)
      }
      themeOff = Math.max(0, themeOff)
      appOff = Math.min(appOff, Math.max(0, y))
      placeStuck()
    }
    const onFocus = () => {
      appOff = 0
      placeStuck()
    }
    // Un élément qui reçoit le focus (Tab, Maj+Tab) ne reste jamais sous la pile collée (WCAG 2.4.11) : le navigateur a
    // défilé d'après la pile d'avant, la remontée a pu la faire redescendre ; on le dégage alors, sans rien pousser.
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement
      if (header?.contains(el)) return
      requestAnimationFrame(() => {
        let bottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 0)
        for (const s of document.querySelectorAll<HTMLElement>('details[data-fold][open] > summary, [data-stick-panel]')) {
          if (s.contains(el)) continue
          const r = s.getBoundingClientRect()
          if (r.bottom > 0 && Math.abs(r.top - (parseFloat(s.style.top) || 0)) < 1) bottom = Math.max(bottom, r.bottom)
        }
        const top = el.getBoundingClientRect().top
        if (top < bottom) {
          freezeHeadroom()
          window.scrollBy({ top: top - bottom - 8, behavior: 'instant' })
        }
      })
    }
    document.addEventListener('focusin', onFocusIn)
    // Un bloc ouvert ou fermé, un en-tête qui change de hauteur : les positions collées se recalculent.
    const onToggle = () => requestAnimationFrame(placeStuck)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('toggle', onToggle, true)
    header?.addEventListener('focusin', onFocus)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('toggle', onToggle, true)
      header?.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusin', onFocusIn)
      appOff = 0
      themeOff = 0
      themeEl = null
      placeStuck()
    }
  }, [enabled, ref])
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Ouvre ou ferme sans animation (les blocs ouverts par le code, les très grands blocs). */
function instant(details: HTMLDetailsElement) {
  details.classList.add('fold-instant')
  window.setTimeout(() => details.classList.remove('fold-instant'), 300)
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
  resetThemeOff()
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
  // Pas de transition de vue : elle remplaçait la page par une image le temps du repli, et la barre de l'application
  // disparaissait puis revenait selon les navigateurs (Arnaud, 20/10). Le contenu se range par sa hauteur (index.css) ;
  // un grand bloc se referme sans animer des milliers de pixels.
  if (r.height > window.innerHeight * 1.5 || reduced()) instant(details)
  close()
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
    'sticky z-20 bg-background shadow-[0_1px_0_var(--border)]',
  motif:
    'sticky z-10 bg-background shadow-[0_1px_0_var(--border)]',
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
  const [open, setOpen] = useState(defaultOpen)
  // La hauteur de l'en-tête ouvert change (titre sur deux lignes, écran tourné) : les en-têtes dessous se replacent.
  useEffect(() => {
    const h = head.current
    if (!open || !h) return
    placeStuck()
    const ro = new ResizeObserver(() => placeStuck())
    ro.observe(h)
    return () => ro.disconnect()
  }, [open])
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
      // Pas de transition de vue à l'ouverture : la ligne ouverte est la ligne fermée, rien ne glisse ; la transition ne
      // faisait que remplacer la page par une image le temps de l'ouvrir (la barre disparaissait, Arnaud, 19/10).
      // Le contenu s'ouvre par sa hauteur (index.css).
      d.open = true
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
      <div className={bodyClassName}>
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
  if (target instanceof HTMLDetailsElement) resetThemeOff()
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
    freezeHeadroom()
    from.style.viewTransitionName = ''
    update()
    target = to()
    if (target) target.style.viewTransitionName = 'fold-chip'
  })
  holdUntil(t.finished)
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
