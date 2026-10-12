import { useEffect, useState } from 'react'

/**
 * Navigation par l'adresse (#/…) : fonctionne sur n'importe quel hébergement
 * statique, sans configuration de serveur.
 */
export type Route =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'project'; id: string; tab: 'data' | 'analysis' | 'report' }
  | { name: 'not-found' }

export function parseRoute(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/'
  if (path === '/' || path === '') return { name: 'home' }
  if (path === '/reglages') return { name: 'settings' }
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
    case 'settings':
      return '#/reglages'
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
