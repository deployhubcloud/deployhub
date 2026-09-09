export const THEME_STORAGE_KEY = 'deployhub.appearance.v1'

// Original palettes informed by Radix's neutral/accent separation, Carbon's
// surface layering, and Linear's restrained chrome. See THEME-RESEARCH.md.
const roles = [
  'bg',
  'surface',
  'subtle',
  'text',
  'muted',
  'line',
  'accent',
  'accent-hover',
  'tint',
  'sidebar',
  'sidebar-text',
  'sidebar-muted',
]
function palette(id, name, description, dark, values) {
  const colors = Object.fromEntries(roles.map((role, index) => [role, values[index]]))
  return {
    id,
    name,
    description,
    dark,
    colors: {
      ...colors,
      'on-accent': dark ? '#172129' : '#f8fafc',
      'sidebar-active': colors.tint,
      terminal: dark ? colors.bg : '#252c35',
      'terminal-text': '#d1d8e1',
      'terminal-muted': '#a2afbf',
      success: dark ? '#abd3ba' : '#35694e',
      'success-bg': dark ? '#293c33' : '#e5efe8',
      warning: dark ? '#dec695' : '#805e24',
      'warning-bg': dark ? '#3e3629' : '#f1eadc',
      danger: dark ? '#e0b0af' : '#9a4647',
      'danger-bg': dark ? '#422f34' : '#f3e5e5',
      shadow: dark ? '#00000024' : '#2734490c',
    },
  }
}

export const themes = [
  palette('mist', 'Porcelain', 'Cool stone · ink blue', false, [
    '#f0f2f4',
    '#f8f9fa',
    '#e8ecf0',
    '#303743',
    '#626975',
    '#d8dde3',
    '#506783',
    '#3e536e',
    '#e5ebf2',
    '#e8ebef',
    '#36404e',
    '#58616e',
  ]),
  palette('paper', 'Warm Linen', 'Soft ivory · muted bronze', false, [
    '#f2f0eb',
    '#f9f7f2',
    '#eae6de',
    '#423e37',
    '#6c665c',
    '#dfd9cd',
    '#74644a',
    '#62543e',
    '#eee7dc',
    '#eae5db',
    '#4c453b',
    '#686052',
  ]),
  palette('sage', 'Eucalyptus', 'Grey stone · quiet green', false, [
    '#eff2ef',
    '#f7f9f6',
    '#e4eae4',
    '#354239',
    '#5d6a60',
    '#d6dfd5',
    '#506f5a',
    '#3f5c49',
    '#e4ece3',
    '#e4eae2',
    '#3c4c3f',
    '#596c5e',
  ]),
  palette('ocean', 'Mineral Blue', 'Silver grey · coastal blue', false, [
    '#edf1f3',
    '#f6f8f9',
    '#e2e9ed',
    '#34434d',
    '#5a6974',
    '#d2dde3',
    '#466b81',
    '#395c72',
    '#e0eaf0',
    '#e2e9ed',
    '#3b4c57',
    '#546a77',
  ]),
  palette('lavender', 'Soft Iris', 'Cloud grey · muted violet', false, [
    '#f0eff3',
    '#f8f7fa',
    '#e7e3ec',
    '#443d50',
    '#6c6278',
    '#ddd7e4',
    '#705d87',
    '#5f4e75',
    '#eae4f0',
    '#e7e2ec',
    '#50445d',
    '#6c5e7b',
  ]),
  palette('rose', 'Dusty Rose', 'Warm stone · antique rose', false, [
    '#f3eff0',
    '#faf7f7',
    '#eae3e5',
    '#504045',
    '#756169',
    '#e3d8dc',
    '#845967',
    '#794f5d',
    '#eee3e7',
    '#eae1e4',
    '#5a454e',
    '#755e68',
  ]),
  palette('sand', 'Sandstone', 'Limestone · brushed brass', false, [
    '#f2eee8',
    '#f9f6f0',
    '#eae3d9',
    '#4d4337',
    '#726250',
    '#e0d6c8',
    '#7d5f40',
    '#6e5338',
    '#eee4d4',
    '#e9e0d4',
    '#594b3a',
    '#72604b',
  ]),
  palette('slate', 'Slate', 'Blue charcoal · silver', true, [
    '#232a33',
    '#2c3440',
    '#363f4c',
    '#e0e5ec',
    '#adb9c9',
    '#465363',
    '#a5b9d2',
    '#bfd0e4',
    '#394859',
    '#232a33',
    '#d5dfec',
    '#abb8ca',
  ]),
  palette('graphite', 'Graphite', 'Carbon grey · pewter', true, [
    '#262829',
    '#303234',
    '#3a3d3f',
    '#e4e5e2',
    '#b6baba',
    '#4d5153',
    '#b0bdb9',
    '#c8d2ce',
    '#414b47',
    '#262829',
    '#dddeda',
    '#b5bbb9',
  ]),
  palette('midnight', 'Midnight', 'Deep ink · soft periwinkle', true, [
    '#242632',
    '#2e3040',
    '#393c4e',
    '#e2e3ee',
    '#b2b5cc',
    '#4c5067',
    '#b5b0da',
    '#cbc5eb',
    '#44435d',
    '#242632',
    '#dadced',
    '#aeb1cc',
  ]),
]

const defaultTheme = themes.find((theme) => theme.id === 'slate')

export function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return themes.find((theme) => theme.id === stored) || defaultTheme
  } catch {
    return defaultTheme
  }
}

let themeFrame

export function applyTheme(theme) {
  const root = document.documentElement
  // Change foregrounds and backgrounds together, including controls with hover transitions.
  cancelAnimationFrame(themeFrame)
  root.classList.add('theme-changing')
  root.dataset.theme = theme.id
  root.dataset.themeMode = theme.dark ? 'dark' : 'light'
  root.style.colorScheme = theme.dark ? 'dark' : 'light'
  for (const [role, color] of Object.entries(theme.colors))
    root.style.setProperty(`--theme-${role}`, color)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.colors.bg)
  themeFrame = requestAnimationFrame(() => {
    themeFrame = requestAnimationFrame(() => root.classList.remove('theme-changing'))
  })
}

// Runs before React mounts so a saved dark theme is present on the first app frame.
applyTheme(readTheme())
