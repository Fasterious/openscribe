import {
  ArrowRight,
  Check,
  ChevronDown,
  FileUp,
  FlaskConical,
  HardDrive,
  KeyRound,
  ListChecks,
  Quote,
  Repeat,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRoundSearch,
  Users,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { href } from '@/app/router'
import { useProjects } from '@/app/store'
import { formatDate } from './format'
import { Alert, Badge, Button, Card, cn } from './primitives'
import { isExample, openExample, projectHref, useStudyActions } from './Synthesis'

/**
 * Page d'accueil : elle présente le produit au visiteur et ramène au travail
 * celui qui revient. Sans compte, c'est ce navigateur qui « se souvient » :
 * s'il contient des études, le bandeau « Reprendre » passe en premier et le
 * héros se réduit à l'essentiel.
 */
export function Home() {
  const projects = useProjects()
  const actions = useStudyActions()
  const mine = projects?.filter((p) => !isExample(p)) ?? []
  const last = mine[0]
  const returning = !!last

  return (
    <div className="space-y-20 sm:space-y-24">
      <div className="space-y-8">
        {returning && (
          <section aria-labelledby="reprendre" className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 id="reprendre" className="font-semibold">
                  Reprendre là où vous en étiez
                </h2>
                <p className="text-sm text-muted-foreground">
                  Votre dernière synthèse, « {last.name} », a été modifiée le {formatDate(last.updatedAt)}.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <a href={href({ name: 'synthesis' })}>
                  <Button variant="ghost" tabIndex={-1}>
                    Toutes vos synthèses
                  </Button>
                </a>
                <a href={projectHref(last)}>
                  <Button tabIndex={-1}>
                    Ouvrir la synthèse <ArrowRight />
                  </Button>
                </a>
              </div>
            </div>
          </section>
        )}

        <section className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-5">
            <h1 className={cn('font-bold tracking-tight', returning ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl')}>
              Des verbatims au rapport, preuves à l'appui.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Importez les réponses ouvertes de vos participants : OpenScribe en tire les motifs et les thèmes, compte qui dit quoi, et relie chaque chiffre au
              verbatim exact.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={actions.newStudy}>
                Commencer une synthèse <ArrowRight />
              </Button>
              <Button size="lg" variant="outline" onClick={() => openExample(projects)}>
                <Sparkles /> Voir un exemple de rapport
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {['Gratuit et libre', 'Sans compte', 'Vos données restent dans votre navigateur'].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <Check className="size-4 text-positive" /> {t}
                </li>
              ))}
            </ul>
            {actions.error && <Alert tone="error">{actions.error}</Alert>}
          </div>
          <ProofDemo />
        </section>
      </div>

      <section aria-labelledby="comment" className="space-y-6">
        <SectionTitle id="comment" title="Comment ça marche" />
        <ol className="grid gap-4 md:grid-cols-3">
          <Step n={1} icon={<Upload />} title="Importez vos réponses">
            Un questionnaire (CSV), des transcriptions d'entretiens, vos notes : seuls ou mêlés dans la même synthèse, chacun avec son nom. Vous vérifiez
            l'aperçu avant de lancer quoi que ce soit.
          </Step>
          <Step n={2} icon={<KeyRound />} title="Branchez un moteur d'IA">
            Une clé gratuite Groq se crée en quelques minutes. Vous pouvez aussi faire tourner Ollama sur votre ordinateur.{' '}
            <a className="text-primary underline-offset-4 hover:underline" href={href({ name: 'settings' })}>
              Choisir un moteur
            </a>
          </Step>
          <Step n={3} icon={<ScanSearch />} title="Lisez le rapport, vérifiez tout">
            Vous suivez chaque étape de l'analyse, puis vous remontez de chaque thème jusqu'au verbatim. Téléchargez le rapport en Markdown, en page HTML ou en
            PDF.
          </Step>
        </ol>
      </section>

      <section aria-labelledby="outils" className="space-y-6">
        <SectionTitle
          id="outils"
          title="Un outil par étape de votre recherche"
          lead="Chaque outil s'utilise seul. Bientôt, ils s'enchaîneront : la transcription d'un entretien alimentera directement une synthèse."
        />
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <a
            href={href({ name: 'synthesis' })}
            className="group block rounded-xl border-2 border-primary/40 bg-card p-5 shadow-sm transition-colors hover:border-primary sm:p-6"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary p-2 text-primary-foreground [&_svg]:size-5">
                <FlaskConical />
              </span>
              <span className="text-xl font-semibold">Synthèse</span>
              <Badge tone="positive">Disponible</Badge>
            </div>
            <p className="mt-3 text-muted-foreground">
              Transformez des dizaines de réponses ouvertes en un rapport que vous pouvez défendre, verbatim à l'appui.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                'Un questionnaire et des entretiens analysés ensemble, avec la même méthode',
                'Motifs et thèmes, avec le nombre de participants derrière chacun',
                'Les avis (positifs, négatifs, mitigés), les suggestions et les questions que se pose le groupe ; où en sont les participants : consensus, majorité, avis partagés',
                "Chaque verbatim tel quel, à retrouver dans son texte d'origine",
                'Filtrer par segment (par exemple les étudiants, puis les retraités)',
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {t}
                </li>
              ))}
            </ul>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Ouvrir l'espace Synthèse <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </a>
          <div className="grid gap-4">
            <SoonModule icon={<Video />} title="Entretiens et tests">
              Passez de l'enregistrement d'un entretien, d'un test utilisateur ou d'une observation de terrain à un texte exploitable : locuteurs identifiés,
              vidéo synchronisée avec le texte.
            </SoonModule>
            <SoonModule icon={<UserRoundSearch />} title="Personas">
              Construisez des profils de participants à partir de vos questionnaires à échelles.
            </SoonModule>
          </div>
        </div>
      </section>

      <section aria-labelledby="difference" className="space-y-6">
        <SectionTitle id="difference" title="Ce qui fait la différence" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Feature icon={<Quote />} title="Chaque chiffre a une source">
            Cliquez sur la pastille d'un constat du rapport : vous remontez jusqu'au verbatim exact du participant. Chaque verbatim est vérifié mot pour mot
            dans vos données.
          </Feature>
          <Feature icon={<Users />} title="Des participants, pas seulement des occurrences">
            « 12 participants sur 40 » dit plus que « 57 occurrences ». OpenScribe compte les deux et les distingue, pour qu'un participant bavard ne pèse pas
            plus que les autres.
          </Feature>
          <Feature icon={<ListChecks />} title="Les voix minoritaires restent visibles">
            Unanimité, majorité, avis partagés, minorités constantes : un avis porté par trois participants ne disparaît pas sous celui de la majorité.
          </Feature>
          <Feature icon={<Repeat />} title="Le même résultat, à chaque fois">
            Mêmes données, mêmes réglages, même rapport. L'IA lit et rédige, le code compte et vérifie, et vous voyez chaque étape avec ses résultats
            intermédiaires.
          </Feature>
        </div>
      </section>

      <section aria-labelledby="donnees" className="space-y-6">
        <SectionTitle id="donnees" title="Vos données, vos règles" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Feature icon={<HardDrive />} title="Tout reste dans votre navigateur">
            Vos synthèses sont enregistrées dans votre navigateur. Il n'y a pas de compte, et aucun serveur OpenScribe ne voit vos données.
          </Feature>
          <Feature icon={<FileUp />} title="Pensez à sauvegarder">
            Vider les données de votre navigateur efface vos synthèses. Sauvegardez chaque synthèse dans un fichier : vous la rouvrirez sur ce navigateur ou sur
            un autre ordinateur.
          </Feature>
          <Feature icon={<KeyRound />} title="Vous choisissez votre moteur d'IA">
            Dans le cloud, avec votre propre clé (Groq, Mistral, Google Gemini, OpenRouter), ou sur votre ordinateur avec Ollama, et rien ne quitte votre
            machine. Les verbatims partent directement de votre navigateur vers le moteur choisi.
          </Feature>
          <Feature icon={<ShieldCheck />} title="Lisez les conditions des offres gratuites">
            Certaines offres gratuites peuvent réutiliser les données qu'on leur envoie. Pour des données sensibles, préférez une offre qui exclut cette
            réutilisation, ou Ollama.
          </Feature>
        </div>
      </section>

      <section aria-labelledby="faq" className="space-y-6">
        <SectionTitle id="faq" title="Questions fréquentes" />
        <div className="divide-y rounded-xl border bg-card">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-medium [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section aria-labelledby="feuille-de-route" className="space-y-6">
        <SectionTitle id="feuille-de-route" title="Ce qui arrive" lead="OpenScribe grandit avec ses utilisateurs. Voici où nous en sommes." />
        <ol className="space-y-3">
          {ROADMAP.map((r) => (
            <li key={r.title} className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-muted-foreground">{r.text}</p>
              </div>
              <Badge tone={r.status === 'Disponible' ? 'positive' : r.status === 'En préparation' ? 'default' : 'outline'} className="w-fit shrink-0">
                {r.status}
              </Badge>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted-foreground">Nous réfléchissons aussi à une offre hébergée clé en main, pour ceux qui ne veulent rien configurer.</p>
      </section>

      {actions.dialogs}
    </div>
  )
}

const FAQ: [string, string][] = [
  [
    'Faut-il installer quelque chose ?',
    "Non, OpenScribe s'ouvre dans votre navigateur. Seule exception, facultative : Ollama, si vous voulez que l'IA tourne sur votre ordinateur.",
  ],
  [
    'Combien ça coûte ?',
    'OpenScribe est gratuit et son code est libre (AGPL-3.0). Groq propose une offre gratuite sans carte bancaire. Sur une offre payante, une synthèse de quelques dizaines de participants coûte en général quelques centimes, payés directement au fournisseur. OpenScribe ne prend rien au passage.',
  ],
  ['Faut-il créer un compte ?', 'Non, ni inscription ni adresse e-mail. Pour retrouver une synthèse ailleurs, sauvegardez-la dans un fichier et rouvrez-la.'],
  [
    'Où vont mes données ?',
    "Nulle part chez nous. Elles restent dans votre navigateur. Pour l'analyse, les verbatims partent uniquement vers le moteur d'IA que vous avez choisi, accompagnés d'un pseudonyme (P1, P2…), jamais de noms ni d'adresses. Avec Ollama, ils ne quittent pas votre ordinateur.",
  ],
  [
    "Quel moteur d'IA choisir ?",
    "Pour démarrer, prenez Groq : c'est gratuit et la clé se crée en quelques minutes. Pour des données sensibles, prenez Ollama sur votre ordinateur, ou une offre qui ne réutilise pas vos données. Vous pouvez en changer à tout moment.",
  ],
  ['Et après ?', 'Les modules « Entretiens et tests » et « Personas » sont en préparation. Voir « Ce qui arrive » ci-dessous.'],
]

const ROADMAP = [
  { title: 'Synthèse', text: 'Des réponses ouvertes au rapport traçable.', status: 'Disponible' },
  {
    title: 'Entretiens et tests',
    text: "Transcription, locuteurs, vidéo synchronisée avec le texte, puis analyse de l'écran que regardait le participant.",
    status: 'En préparation',
  },
  { title: 'Personas', text: 'Des profils à partir de questionnaires à échelles.', status: 'En préparation' },
  {
    title: 'Synchronisation chiffrée',
    text: 'Vos travaux copiés sur votre propre Drive, pour les retrouver sur tous vos appareils.',
    status: 'Envisagé',
  },
  { title: 'Tests à distance et ateliers en direct', text: 'Mener vos tests et vos ateliers directement dans OpenScribe.', status: 'Envisagé' },
]

/** Montre la traçabilité plutôt que de l'affirmer : un constat de l'exemple, dont on déplie les verbatims. */
function ProofDemo() {
  const [open, setOpen] = useState(false)
  const quotes = [
    ['P1', "L'application est lente au démarrage, il faut parfois attendre dix secondes."],
    ['P5', "L'application est lente, surtout sur mon vieux téléphone."],
    ['P10', "Je trouve l'application lente"],
  ]
  return (
    <Card className="p-5 shadow-md">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Extrait du rapport d'exemple</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">Vitesse de l'application</p>
        <span className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            <Users className="mr-0.5 inline size-3" />3
          </span>
          <Badge tone="outline">Peu d'avis</Badge>
        </span>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div className="w-full bg-negative" />
      </div>
      <p className="mt-3 text-sm leading-relaxed">
        Trois personnes trouvent l'application lente. L'une attend parfois dix secondes au démarrage, une autre précise que c'est surtout vrai sur son vieux
        téléphone.
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Masquer les 3 verbatims' : 'Voir les 3 verbatims'}
          className="mx-1 inline-flex cursor-pointer items-center gap-0.5 rounded-full bg-accent px-1.5 align-baseline text-xs font-medium text-accent-foreground hover:bg-primary hover:text-primary-foreground"
        >
          <Quote className="size-3" />3
        </button>
      </p>
      {open ? (
        <ul className="mt-3 space-y-2 border-l-2 border-negative pl-3 text-sm">
          {quotes.map(([who, text]) => (
            <li key={who}>
              « {text} » <span className="text-xs text-muted-foreground">— {who}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">Cliquez sur la pastille pour voir les verbatims.</p>
      )}
    </Card>
  )
}

function SectionTitle({ id, title, lead }: { id: string; title: string; lead?: string }) {
  return (
    <div className="max-w-2xl space-y-2">
      <h2 id={id} className="text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>
      {lead && <p className="text-muted-foreground">{lead}</p>}
    </div>
  )
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="space-y-2 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{n}</span>
        <span className="text-primary [&_svg]:size-5">{icon}</span>
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </li>
  )
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-xl border bg-card p-5">
      <span className="mt-0.5 text-primary [&_svg]:size-5">{icon}</span>
      <div className="space-y-1">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  )
}

function SoonModule({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-muted p-2 text-muted-foreground [&_svg]:size-5">{icon}</span>
        <span className="font-semibold">{title}</span>
        <Badge tone="outline">Bientôt</Badge>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
