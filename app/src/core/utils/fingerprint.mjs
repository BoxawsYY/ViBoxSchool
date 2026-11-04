export async function getFingerprint() {
    try {
        const FingerprintJS = await import('https://openfpcdn.io/fingerprintjs/v4')
        const fp = await FingerprintJS.load()
        const result = await fp.get()
        return result.visitorId
    }
    catch (error) {
        return await getGenericFingerprint()
    }
}

export async function getGenericFingerprint() {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ].join('|')

  const encoder = new TextEncoder()
  const data = encoder.encode(raw)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}