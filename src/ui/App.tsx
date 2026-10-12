import { Settings as SettingsIcon } from 'lucide-react'
import { href, useRoute } from '@/app/router'
import { Home } from './Home'
import { ProjectPage } from './project/ProjectPage'
import { SettingsPage } from './Settings'
import { Button } from './primitives'

export function App() {
  const route = useRoute()
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="no-print sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <a href={href({ name: 'home' })} className="flex items-center gap-2 font-semibold">
            <img src="/logo.svg" alt="" className="h-7 w-7" />
            <span>OpenScribe</span>
          </a>
          <nav aria-label="Navigation principale">
            <a href={href({ name: 'settings' })}>
              <Button variant={route.name === 'settings' ? 'outline' : 'ghost'} size="sm" tabIndex={-1}>
                <SettingsIcon /> <span>Moteurs d'IA</span>
              </Button>
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        {route.name === 'home' && <Home />}
        {route.name === 'settings' && <SettingsPage />}
        {route.name === 'project' && <ProjectPage id={route.id} tab={route.tab} />}
        {route.name === 'not-found' && (
          <p>
            Page introuvable. <a className="text-primary underline" href="#/">Retour à l'accueil</a>
          </p>
        )}
      </main>
      <footer className="no-print border-t py-4 text-center text-xs text-muted-foreground">
        OpenScribe · logiciel libre (AGPL-3.0) · vos données restent dans ce navigateur
      </footer>
    </div>
  )
}
