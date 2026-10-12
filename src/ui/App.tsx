import { FlaskConical, KeyRound } from 'lucide-react'
import { useEngines } from '@/app/engines'
import { href, useRoute } from '@/app/router'
import { Home } from './Home'
import { cn } from './primitives'
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
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <a href={href({ name: 'home' })} className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="" className="h-7 w-7" />
            <span>OpenScribe</span>
          </a>
          <nav aria-label="Navigation principale" className="flex items-center gap-1">
            <NavLink href={href({ name: 'synthesis' })} active={inSynthesis}>
              <FlaskConical className="size-4" /> Synthèse
            </NavLink>
            <NavLink href={href({ name: 'settings' })} active={route.name === 'settings'}>
              <KeyRound className="size-4" />
              <span className="whitespace-nowrap">Moteurs d'IA</span>
              {loaded && (
                <span
                  className={cn(
                    'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs',
                    engine && engineOk ? 'bg-positive/15 text-positive' : 'bg-warning/25 text-foreground',
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', engine && engineOk ? 'bg-positive' : 'bg-warning')} aria-hidden />
                  <span className="hidden whitespace-nowrap sm:inline">{engine ? `${engine.name.replace(/ \(.*\)$/, '')}${engineOk ? '' : ' · à vérifier'}` : 'à choisir'}</span>
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
            Page introuvable. <a className="text-primary underline" href="#/">Retour à l'accueil</a>
          </p>
        )}
      </main>
      <footer className="no-print mt-12 border-t py-5 text-center text-xs text-muted-foreground">
        OpenScribe, logiciel libre de recherche utilisateur (AGPL-3.0) · Vos études restent dans votre navigateur
      </footer>
    </div>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors hover:bg-accent',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      {children}
    </a>
  )
}
