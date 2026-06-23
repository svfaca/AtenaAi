import { aboutPageData } from '../../data/aboutPageData'
import { AboutAudience } from './AboutAudience'
import { AboutCTA } from './AboutCTA'
import { AboutDifferential } from './AboutDifferential'
import { AboutFeatures } from './AboutFeatures'
import { AboutHero } from './AboutHero'
import { AboutMission } from './AboutMission'
import { AboutProblem } from './AboutProblem'
import { AboutSolution } from './AboutSolution'

export function AboutPublic() {
  const content = aboutPageData.visitor

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <AboutHero content={content.hero} showMockup />
      <AboutProblem items={content.problem} />
      <AboutSolution description={content.solution} />
      <AboutFeatures items={content.features} />
      <AboutDifferential items={content.differentialItems} />
      <AboutAudience items={content.audience} />
      <AboutMission mission={content.mission} vision={content.vision} />
      <AboutCTA
        title={content.ctaTitle}
        description={content.ctaDescription}
        actions={[{ label: content.ctaPrimaryLabel, href: content.ctaPrimaryHref }]}
      />
    </div>
  )
}
