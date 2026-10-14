import { useEffect, useState } from 'react'

/**
 * Navigation par l'adresse (#/…) : fonctionne sur n'importe quel hébergement
 * statique, sans configuration de serveur.
 */
export type Route =
  | { name: 'home' }
  | { name: 'synthesis' }
  /** L'Observatoire : analyses publiques de consultations ouvertes ; `slug` ouvre l'une d'elles. */
  | { name: 'observatory'; slug?: string }
  /** `back` : l'étude d'où l'on vient, pour y revenir après avoir configuré un moteur. */
  | { name: 'settings'; back?: string }
  | { name: 'project'; id: string; tab: 'data' | 'analysis' | 'report' }
  | { name: 'not-found' }

export function parseRoute(hash: string): Route {
  const [path = '/', query = ''] = (hash.replace(/^#/, '') || '/').split('?')
  const params = new URLSearchParams(query)
  if (path === '/' || path === '') return { name: 'home' }
  if (path === '/synthese') return { name: 'synthesis' }
  const o = path.match(/^\/observatoire(?:\/([a-z0-9-]+))?$/)
  if (o) return { name: 'observatory', slug: o[1] }
  if (path === '/moteurs' || path === '/reglages') return { name: 'settings', back: params.get('retour') ?? undefined }
  const m = path.match(/^\/etude\/([^/]+)(?:\/(donnees|analyse|rapport))?$/)
  if (m) {
    const tab = m[2] === 'analyse' ? 'analysis' : m[2] === 'rapport' ? 'report' : 'data'
    return { name: 'project', id: decodeURIComponent(m[1]), tab }
  }
  return { name: 'not-found' }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/'
    case 'synthesis':
      return '#/synthese'
    case 'observatory':
      return route.slug ? `#/observatoire/${route.slug}` : '#/observatoire'
    case 'settings':
      return route.back ? `#/moteurs?retour=${encodeURIComponent(route.back)}` : '#/moteurs'
    case 'project':
      return `#/etude/${encodeURIComponent(route.id)}/${route.tab === 'analysis' ? 'analyse' : route.tab === 'report' ? 'rapport' : 'donnees'}`
    default:
      return '#/'
  }
}

export function navigate(route: Route) {
  window.location.hash = href(route)
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(window.location.hash))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
