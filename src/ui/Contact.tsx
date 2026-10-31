import { ArrowLeft, BookOpen, Bug, ExternalLink, Lightbulb, ListChecks, MessageCircleQuestion } from 'lucide-react'
import { parseRoute } from '@/app/router'
import { Alert } from './primitives'

const REPO = 'https://github.com/Fasterious/openscribe'
export const SOURCE_URL = REPO

/**
 * Contacter le projet et y contribuer. Sans serveur du projet, il n'y a pas de formulaire ici :
 * chaque carte ouvre le bon endroit sur GitHub, et rien de ce qui est dans ce navigateur n'y part.
 */
export function ContactPage({ back }: { back?: string }) {
  return (
    <div>
      <header className="mb-8 space-y-2">
        {back && (
          <a href={back} className="inline-flex min-h-6 items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> {parseRoute(back).name === 'project' ? 'Revenir à votre synthèse' : "Revenir à l'étude"}
          </a>
        )}
        <h1 className="text-3xl font-bold tracking-tight">Contact et contribution</h1>
        <p className="max-w-lecture text-muted-foreground">
          OpenScribe est un logiciel libre : il progresse grâce à ceux qui l'utilisent. Tout se passe sur GitHub, le site qui héberge le projet, avec un compte gratuit. Le site est en anglais, mais vous pouvez nous écrire en français.
        </p>
      </header>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
        <section aria-labelledby="ecrire" className="space-y-4 max-lg:max-w-lecture">
          <h2 id="ecrire" className="text-xl font-semibold">
            Nous écrire
          </h2>
          <Alert tone="warning">Ces échanges sont publics : ne partagez pas d'informations sensibles.</Alert>
          <div className="grid gap-3">
            <LinkCard href={`${REPO}/discussions/new?category=q-a`} icon={<MessageCircleQuestion />} title="Poser une question">
              Comment faire, ce que veut dire un chiffre, quel moteur d'IA choisir.
            </LinkCard>
            <LinkCard href={`${REPO}/issues/new?template=bug.yml`} icon={<Bug />} title="Signaler un défaut">
              Quelque chose ne marche pas comme prévu.
            </LinkCard>
            <LinkCard href={`${REPO}/discussions/new?category=ideas`} icon={<Lightbulb />} title="Proposer une amélioration">
              Une idée, un besoin, une consultation à analyser pour l'Observatoire.
            </LinkCard>
          </div>
        </section>
        <section aria-labelledby="contribuer" className="space-y-4 max-lg:max-w-lecture">
          <h2 id="contribuer" className="text-xl font-semibold">
            Contribuer
          </h2>
          <p className="text-sm text-muted-foreground">
            Inutile de savoir coder : signaler un défaut, tester OpenScribe sur vos données et dire ce qui vous a gêné, proposer une meilleure formulation, c'est déjà contribuer.
          </p>
          <div className="grid gap-3">
            <LinkCard href={`${REPO}/blob/main/CONTRIBUTING.md`} icon={<BookOpen />} title="Lire le guide de contribution">
              Installer le projet, lancer les tests, proposer une modification.
            </LinkCard>
            <LinkCard href={`${REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`} icon={<ListChecks />} title="Choisir une première tâche">
              Des tâches courtes pour qui sait coder : chacune dit quoi faire et où.
            </LinkCard>
          </div>
        </section>
      </div>
    </div>
  )
}

/** Toute la carte est le lien, vers GitHub, dans un nouvel onglet : le travail en cours reste ouvert ici. */
function LinkCard({ href, icon, title, children }: { href: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex items-start gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary"
    >
      <span className="mt-0.5 shrink-0 text-primary [&_svg]:size-5">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium group-hover:text-primary">
          {title}
          <span className="sr-only"> (GitHub, nouvel onglet)</span>
        </span>
        <span className="block text-sm text-muted-foreground">{children}</span>
      </span>
      <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden />
    </a>
  )
}
