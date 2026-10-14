/**
 * Où tourne un moteur : sur cet ordinateur, ou en ligne. Seule une adresse
 * locale (localhost, 127.0.0.1, ::1) compte comme « sur votre ordinateur » :
 * un serveur sur le réseau, même privé, est « en ligne ». Le mode Confidentiel
 * s'appuie sur cette règle, appliquée par le code et non déclarée par le moteur.
 */
export function runsLocally(baseUrl: string): boolean {
  if (baseUrl === 'local') return true // moteur intégré (simulation)
  try {
    const host = new URL(baseUrl).hostname.replace(/^\[|\]$/g, '')
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.localhost')
  } catch {
    return false
  }
}
