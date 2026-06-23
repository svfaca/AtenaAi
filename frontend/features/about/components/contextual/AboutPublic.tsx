import { useState } from 'react'
import { LoginModal, SignupModal } from '@/features/auth'
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
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const content = aboutPageData.visitor

  const handleOpenSignup = () => {
    setSignupOpen(true)
  }

  const handleScrollToProblem = () => {
    const section = document.getElementById('about-problem-section')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-950">
      <AboutHero
        content={content.hero}
        showMockup
        onPrimaryActionClick={handleOpenSignup}
        onSecondaryActionClick={handleScrollToProblem}
      />
      <AboutProblem items={content.problem} />
      <AboutSolution description={content.solution} />
      <AboutFeatures items={content.features} />
      <AboutDifferential items={content.differentialItems} />
      <AboutAudience items={content.audience} />
      <AboutMission mission={content.mission} vision={content.vision} />
      <AboutCTA
        title={content.ctaTitle}
        description={content.ctaDescription}
        actions={[{ label: content.ctaPrimaryLabel, href: '/' }]}
        onActionClick={handleOpenSignup}
      />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToSignup={() => {
          setLoginOpen(false)
          setSignupOpen(true)
        }}
      />
      <SignupModal
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        onSwitchToLogin={() => {
          setSignupOpen(false)
          setLoginOpen(true)
        }}
      />
    </div>
  )
}
