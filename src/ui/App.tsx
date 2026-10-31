import { House, KeyRound, Layers, MessagesSquare, Mic, PenTool, Telescope, UserRound } from 'lucide-react'
import { useRef } from 'react'
import { useEngines } from '@/app/engines'
import { href, isStudy, useRoute } from '@/app/router'
import { ContactPage, SOURCE_URL } from './Contact'
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
  // Depuis une étude, Contact offre le retour, à l'onglet où l'on était.
  const contact = href({ name: 'contact', back: isStudy(route) ? href(route) : undefined })
  // Sur les pages de lecture (rapport, étude de l'Observatoire), la barre se cache quand on descend, revient quand on remonte.
  const reading = route.name === 'observatory' || (route.name === 'project' && route.tab === 'report')
  const header = useRef<HTMLElement>(null)
  useHeadroom(reading, header)

  return (
    <div className="min-h-dvh flex flex-col">
      <header
        ref={header}
        className={cn(
          // Sur les pages de lecture, les en-têtes collés la poussent hors de l'écran au rythme du défilement (fold.tsx, useHeadroom).
          // Ses liens au focus ne font pas défiler la page (la marge de défilement ne vaut pas pour elle, toujours en haut).
          'no-print sticky top-0 z-30 border-b bg-background [view-transition-name:app-bar] [&_*]:-scroll-mt-96',
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
          <nav aria-label="Contact et réglages" className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            {/* Sous 432 px, elle passerait sous les modules : le pied de page reste l'entrée (designer-ui, 31/10). */}
            <NavItem href={contact} active={route.name === 'contact'} icon={<MessagesSquare />} label="Contact" className="max-[27rem]:hidden" />
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
                    // Le nom du moteur se modifie : il n'apparaît qu'à partir de `md` et se tronque, « à vérifier » jamais (designer-ui, 31/10).
                    'max-md:absolute max-md:top-1.5 max-md:right-1 md:px-2 md:py-0.5',
                    engine && engineOk ? 'md:bg-positive/15 md:text-positive' : 'md:bg-warning/25 md:text-foreground',
                  )}
                  aria-hidden
                >
                  <span className={cn('size-1.5 rounded-full max-md:size-2', engine && engineOk ? 'bg-positive' : 'bg-warning')} />
                  <span className="hidden max-w-40 min-w-0 whitespace-nowrap md:flex" title={engine?.name}>
                    <span className="truncate">{engine ? engine.name.replace(/ \(.*\)$/, '') : 'à choisir'}</span>
                    {engine && !engineOk && <span className="shrink-0 whitespace-pre"> · à vérifier</span>}
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
        {route.name === 'contact' && <ContactPage back={route.back} />}
        {route.name === 'not-found' && (
          <p>
            Page introuvable.{' '}
            <a className="text-primary underline" href="#/">
              Retour à l'accueil
            </a>
          </p>
        )}
      </main>
      <footer className="no-print mt-12 border-t px-4 py-5 text-center text-xs text-muted-foreground">
        <p>
          OpenScribe, logiciel libre de recherche utilisateur (<span className="whitespace-nowrap">AGPL-3.0</span>) · Vos données restent dans votre navigateur
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-x-3">
          <a href={href({ name: 'observatories' })} className="inline-block py-1 underline hover:text-foreground">
            L'Observatoire
          </a>
          <a href={contact} className="inline-block py-1 underline hover:text-foreground">
            Contact et contribution
          </a>
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className="inline-block py-1 underline hover:text-foreground">
            Code source
          </a>
        </div>
      </footer>
    </div>
  )
}

/** Un module annoncé mais pas encore disponible : visible pour situer la suite, grisé, expliqué au survol et au toucher. */
function SoonItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <Explain content={`${label} : ce module n'est pas encore disponible.`}>
      {/* Sous 352 px, les modules à venir se masquent : sinon ils passent sous « Moteurs d'IA » (designer-ui, 19/10). */}
      <span aria-label={`${label}, bientôt`} className="flex h-9 cursor-not-allowed items-center rounded-md px-1.5 text-muted-foreground/50 max-[22rem]:hidden min-[400px]:px-2 sm:px-2.5 [&_svg]:size-4">
        {icon}
      </span>
    </Explain>
  )
}

/** Une entrée du menu : l'icône seule ; la page où l'on est affiche aussi son nom. */
function NavItem({ href, active, icon, label, className }: { href: string; active: boolean; icon: React.ReactNode; label: string; className?: string }) {
  return (
    <Tooltip content={label}>
      <a
        href={href}
        aria-current={active ? 'page' : undefined}
        aria-label={label}
        className={cn(
          'flex h-9 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-sm font-medium transition-colors hover:bg-accent min-[400px]:px-2 sm:px-2.5 [&_svg]:size-4',
          active && 'bg-accent text-accent-foreground',
          className,
        )}
      >
        {icon}
        {active && <span className="whitespace-nowrap">{label}</span>}
      </a>
    </Tooltip>
  )
}
