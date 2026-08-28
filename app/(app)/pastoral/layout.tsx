import { Bebas_Neue, EB_Garamond, Montserrat, Playfair_Display } from 'next/font/google'
import PastoralEditorRuntimeEnhancements from '@/components/pastoral/PastoralEditorRuntimeEnhancements'
import PastoralElementsViewEnhancements from '@/components/pastoral/PastoralElementsViewEnhancements'
import './pastoral-visual-system.css'
import './pastoral-workspace-v2.css'
import './pastoral-editor-v3.css'
import './pastoral-editor-stable.css'
import './pastoral-editor-feedback-v13.css'
import './pastoral-editor-feedback-v14.css'
import './pastoral-editor-feedback-v15.css'
import './pastoral-editor-feedback-v16.css'

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  variable: '--font-pastoral-eb-garamond',
  display: 'swap',
})

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-pastoral-montserrat',
  display: 'swap',
})

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-pastoral-playfair-display',
  display: 'swap',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-pastoral-bebas-neue',
  display: 'swap',
})

export default function PastoralLayout({ children }: { children: React.ReactNode }) {
  const fuentesPastorales = `${ebGaramond.variable} ${montserrat.variable} ${playfairDisplay.variable} ${bebasNeue.variable}`
  return <div className={`pastoral-visual-system ${fuentesPastorales}`}>{children}<PastoralEditorRuntimeEnhancements /><PastoralElementsViewEnhancements /></div>
}
