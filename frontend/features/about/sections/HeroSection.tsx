import { aboutData } from '../data/aboutData'
import { AboutHero } from '../components/AboutHero'

export function HeroSection() {
  return <AboutHero title={aboutData.hero.title} subtitle={aboutData.hero.subtitle} />
}
