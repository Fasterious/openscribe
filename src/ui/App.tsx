import { FlaskConical, House, KeyRound, Mic, Newspaper, PenTool, UserRound } from 'lucide-react'
import { useEngines } from '@/app/engines'
import { href, useRoute } from '@/app/router'
import { Home } from './Home'
import { cn, Tooltip } from './primitives'
import { ProjectPage } from './project/ProjectPage'
import { SettingsPage } from './Settings'
import { SynthesisPage } from './Synthesis'

export function App() {
  const route = useRoute()
  const { engines, defaultId, loaded } = useEngines()
  const engine = engines.find((e) => e.id === defaultId) ?? engines.find((e) => e.verified !== false)
  const engineOk = engine?.verified !== false
  const inSynthesis = route.name === 'synthesis' || route.name === 'project'

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        {/* À gauche, les modules (où je suis, où je peux aller) ; à droite, les moteurs d'IA, communs à tous les modules. */}
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <nav aria-label="Modules" className="flex min-w-0 items-center gap-1">
            <a href={href({ name: 'home' })} className="mr-2 flex shrink-0 items-center gap-2 font-semibold" aria-label="OpenScribe, accueil">
              <img src="/logo.svg" alt="" className="h-7 w-7" />
              <span className="hidden lg:inline">OpenScribe</span>
            </a>
            {/* Sur mobile, le logo mène à l'accueil : l'icône en double laisse la place à l'Observatoire. */}
            <NavLink href={href({ name: 'home' })} active={route.name === 'home'} className="hidden sm:flex">
              <House className="size-4" /> Accueil
            </NavLink>
            <NavLink href={href({ name: 'synthesis' })} active={inSynthesis}>
              <FlaskConical className="size-4" /> Synthèse
            </NavLink>
            {/* Les études publiées : des pages à part, qui portent ce même menu pour revenir. */}
            <NavLink href="/observatoire/" active={false}>
              <Newspaper className="size-4" /> <span className="sr-only sm:not-sr-only">Observatoire</span>
            </NavLink>
            <SoonLink icon={<Mic className="size-4" />} label="Entretiens" />
            <SoonLink icon={<UserRound className="size-4" />} label="Personas" />
            <SoonLink icon={<PenTool className="size-4" />} label="Ateliers" />
          </nav>
          <nav aria-label="Réglages" className="flex shrink-0 items-center">
            <NavLink href={href({ name: 'settings' })} active={route.name === 'settings'}>
              <KeyRound className="size-4" />
              <span className="sr-only whitespace-nowrap min-[380px]:not-sr-only">Moteurs d'IA</span>
              {loaded && (
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                    engine && engineOk ? 'bg-positive/15 text-positive' : 'bg-warning/25 text-foreground',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', engine && engineOk ? 'bg-positive' : 'bg-warning')} aria-hidden />
                  <span className="hidden whitespace-nowrap sm:inline">
                    {engine ? `${engine.name.replace(/ \(.*\)$/, '')}${engineOk ? '' : ' · à vérifier'}` : 'à choisir'}
                  </span>
                  <span className="sr-only sm:hidden">{engine ? `Moteur : ${engine.name}${engineOk ? '' : ', à vérifier'}` : 'Moteur à choisir'}</span>
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
        {route.name === 'home' && <Home />}
        {route.name === 'synthesis' && <SynthesisPage />}
        {route.name === 'settings' && <SettingsPage back={route.back} />}
        {route.name === 'project' && <ProjectPage id={route.id} tab={route.tab} />}
        {route.name === 'not-found' && (
          <p>
            Page introuvable.{' '}
            <a className="text-primary underline" href="#/">
              Retour à l'accueil
            </a>
          </p>
        )}
      </main>
      <footer className="no-print mt-12 border-t py-5 text-center text-xs text-muted-foreground">
        OpenScribe, logiciel libre de recherche utilisateur (AGPL-3.0) · Vos données restent dans votre navigateur ·{' '}
        <a href="/observatoire/" className="underline hover:text-foreground">
          L'Observatoire
        </a>
      </footer>
    </div>
  )
}

/** Un module annoncé mais pas encore disponible : visible pour situer la suite, grisé, expliqué au survol. */
function SoonLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Tooltip content={`${label} : ce module n'est pas encore disponible.`}>
      <button
        type="button"
        aria-disabled="true"
        className="hidden cursor-not-allowed items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground/60 md:flex"
      >
        {icon} {label}
      </button>
    </Tooltip>
  )
}

function NavLink({ href, active, className, children }: { href: string; active: boolean; className?: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors hover:bg-accent',
        active && 'bg-accent text-accent-foreground',
        className,
      )}
    >
      {children}
    </a>
  )
}
