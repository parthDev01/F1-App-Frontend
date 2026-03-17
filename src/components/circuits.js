/**
 * F1 2026 Circuit Configuration
 * SVG paths fetched at runtime from julesr0y/f1-circuits-svg via jsDelivr CDN.
 * Uses the LONGEST path in each SVG = the full circuit outline.
 * Bahrain and Jeddah skipped — not on 2026 calendar.
 */

const CDN = 'https://cdn.jsdelivr.net/gh/julesr0y/f1-circuits-svg@main/circuits/black'

export const CIRCUIT_FILES = {
  albert_park:   `${CDN}/melbourne-1.svg`,
  shanghai:      `${CDN}/shanghai-1.svg`,
  suzuka:        `${CDN}/suzuka-1.svg`,
  miami:         `${CDN}/miami-1.svg`,
  montreal:      `${CDN}/montreal-1.svg`,
  monaco:        `${CDN}/monaco-6.svg`,
  barcelona:     `${CDN}/catalunya-1.svg`,
  red_bull_ring: `${CDN}/spielberg-3.svg`,
  silverstone:   `${CDN}/silverstone-8.svg`,
  spa:           `${CDN}/spa-francorchamps-3.svg`,
  hungaroring:   `${CDN}/hungaroring-3.svg`,
  zandvoort:     `${CDN}/zandvoort-5.svg`,
  monza:         `${CDN}/monza-7.svg`,
  madrid:        `${CDN}/madring-1.svg`,
  baku:          `${CDN}/baku-1.svg`,
  singapore:     `${CDN}/marina-bay-1.svg`,
  austin:        `${CDN}/austin-1.svg`,
  mexico_city:   `${CDN}/mexico-city-3.svg`,
  interlagos:    `${CDN}/interlagos-1.svg`,
  las_vegas:     `${CDN}/las-vegas-1.svg`,
  losail:        `${CDN}/lusail-1.svg`,
  yas_marina:    `${CDN}/yas-marina-2.svg`,
}

// Per-circuit viewBox overrides — set after seeing the actual SVG dimensions
// Default is 0 0 500 500. Override here if a circuit renders too small/large.
const VIEWBOX_OVERRIDES = {}

// In-memory cache
const svgCache = {}   // { path, viewBox }

/**
 * Fetch circuit SVG and extract:
 *   - The LONGEST path d= attribute (= full circuit outline, not a sector)
 *   - The viewBox from the <svg> element
 */
export async function fetchCircuitPath(circuitKey) {
  if (svgCache[circuitKey] !== undefined) return svgCache[circuitKey]

  const url = CIRCUIT_FILES[circuitKey]
  if (!url) { svgCache[circuitKey] = null; return null }

  try {
    const res = await fetch(url)
    if (!res.ok) { svgCache[circuitKey] = null; return null }
    const text = await res.text()

    // Extract viewBox
    const vbMatch = text.match(/viewBox=["']([^"']+)["']/)
    const viewBox = VIEWBOX_OVERRIDES[circuitKey] || (vbMatch ? vbMatch[1] : '0 0 500 500')

    // Extract ALL path d= attributes and pick the longest one
    // The longest path = full circuit outline (sectors are shorter sub-paths)
    const pathRegex = /\sd="([^"]+)"/g
    let match
    let longestPath = ''
    while ((match = pathRegex.exec(text)) !== null) {
      if (match[1].length > longestPath.length) {
        longestPath = match[1]
      }
    }

    if (!longestPath) { svgCache[circuitKey] = null; return null }

    svgCache[circuitKey] = { path: longestPath, viewBox }
    return svgCache[circuitKey]
  } catch {
    svgCache[circuitKey] = null
    return null
  }
}

export const FALLBACK_CIRCUITS = {}

export const DEFAULT_CIRCUIT = {
  viewBox: '0 0 500 500',
  path: 'M 250,80 C 350,80 420,150 420,250 C 420,350 350,420 250,420 C 150,420 80,350 80,250 C 80,150 150,80 250,80 Z',
  name: 'CIRCUIT',
}

export const CIRCUITS = {}
