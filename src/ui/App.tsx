import { House, KeyRound, Layers, Mic, PenTool, Telescope, UserRound } from 'lucide-react'
import { useRef } from 'react'
import { useEngines } from '@/app/engines'
import { href, useRoute } from '@/app/router'
import { Home } from './Home'
import { ObservatoryList, ObservatoryPage } from './Observatory'
import { cn, Explain, Tooltip } from './primitives'
import { useHeadroom } from './project/fold'
import { ProjectPage } from './project/ProjectPage'
import { SettingsPage } from './Settings'
import { SynthesisPage } from './Synthesis'

export function App() {
  const route = useRoute()
  const { engines, defaultId, loaded } = useEngines()
  const engine = engines.find((e) => e.id === defaultId) ?? engines.find((e) => e.verified !== false)
  const engineOk = engine?.verified !== false
  const inSynthesis = route.name === 'synthesis' || route.name === 'project'
  // Sur les pages de lecture (rapport, étude de l'Observatoire), la barre se cache quand on descend, revient quand on remonte.
  const reading = route.name === 'observatory' || (route.name === 'project' && route.tab === 'report')
  const header = useRef<HTMLElement>(null)
  const hidden = useHeadroom(reading, header)

  return (
    <div className="min-h-dvh flex flex-col">
      <header
        ref={header}
        className={cn(
          'no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur transition-transform duration-200 motion-reduce:transition-none',
          hidden && '-translate-y-full',
        )}
      >
        {/* À gauche, les modules (où je suis, où je peux aller) ; à droite, les moteurs d'IA, communs à tous les modules. */}
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          {/* Des icônes ; la page où l'on est dit son nom (demande d'Arnaud, 17/10). Les modules à venir restent visibles, grisés. */}
          <nav aria-label="Modules" className="flex min-w-0 items-center gap-0.5 sm:gap-1">
            <a href={href({ name: 'home' })} className="mr-0.5 flex shrink-0 items-center gap-2 font-semibold sm:mr-1" aria-label="OpenScribe, accueil">
              <img src="/logo.svg" alt="" className="h-6 w-6 sm:h-7 sm:w-7" />
              <span className="hidden lg:inline">OpenScribe</span>
            </a>
            <NavItem href={href({ name: 'home' })} active={route.name === 'home'} icon={<House />} label="Accueil" />
            <NavItem href={href({ name: 'synthesis' })} active={inSynthesis} icon={<Layers />} label="Synthèse" />
            <NavItem href={href({ name: 'observatories' })} active={route.name === 'observatory' || route.name === 'observatories'} icon={<Telescope />} label="Observatoire" />
            <SoonItem icon={<Mic />} label="Entretiens" />
            <SoonItem icon={<UserRound />} label="Personas" />
            <SoonItem icon={<PenTool />} label="Ateliers" />
          </nav>
          <nav aria-label="Réglages" className="flex shrink-0 items-center">
            <a
              href={href({ name: 'settings' })}
              aria-current={route.name === 'settings' ? 'page' : undefined}
              aria-label={`Moteurs d'IA : ${engine ? `${engine.name}${engineOk ? '' : ', à vérifier'}` : 'à choisir'}`}
              className={cn(
                'relative flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent sm:px-2.5',
                route.name === 'settings' && 'bg-accent text-accent-foreground',
              )}
            >
              <KeyRound className="size-4" />
              <span className={cn('whitespace-nowrap', route.name === 'settings' ? '' : 'hidden md:inline')}>Moteurs d'IA</span>
              {loaded && (
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full text-xs',
                    'max-sm:absolute max-sm:top-1.5 max-sm:right-1 sm:px-2 sm:py-0.5',
                    engine && engineOk ? 'sm:bg-positive/15 sm:text-positive' : 'sm:bg-warning/25 sm:text-foreground',
                  )}
                  aria-hidden
                >
                  <span className={cn('size-1.5 rounded-full max-sm:size-2', engine && engineOk ? 'bg-positive' : 'bg-warning')} />
                  <span className="hidden whitespace-nowrap sm:inline">
                    {engine ? `${engine.name.replace(/ \(.*\)$/, '')}${engineOk ? '' : ' · à vérifier'}` : 'à choisir'}
                  </span>
                </span>
              )}
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
        {route.name === 'home' && <Home />}
        {route.name === 'synthesis' && <SynthesisPage />}
        {route.name === 'settings' && <SettingsPage back={route.back} />}
        {route.name === 'project' && <ProjectPage id={route.id} tab={route.tab} />}
        {route.name === 'observatory' && <ObservatoryPage slug={route.slug} />}
        {route.name === 'observatories' && <ObservatoryList />}
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
        <a href={href({ name: 'observatories' })} className="underline hover:text-foreground">
          L'Observatoire
        </a>
      </footer>
    </div>
  )
}

/** Un module annoncé mais pas encore disponible : visible pour situer la suite, grisé, expliqué au survol et au toucher. */
function SoonItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Explain content={`${label} : ce module n'est pas encore disponible.`}>
      <span aria-label={`${label}, bientôt`} className="flex h-9 cursor-not-allowed items-center rounded-md px-1.5 text-muted-foreground/50 min-[400px]:px-2 sm:px-2.5 [&_svg]:size-4">
        {icon}
      </span>
    </Explain>
  )
}

/** Une entrée du menu : l'icône seule ; la page où l'on est affiche aussi son nom. */
function NavItem({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Tooltip content={label}>
      <a
        href={href}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={cn(
          'flex h-9 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors hover:bg-accent min-[400px]:px-2 sm:px-2.5 [&_svg]:size-4',
          active && 'bg-accent text-accent-foreground',
        )}
      >
        {icon}
        {active && <span className="whitespace-nowrap">{label}</span>}
      </a>
    </Tooltip>
  )
}
