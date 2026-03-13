import { AboutMission } from '../components/AboutMission'
import { aboutData } from '../data/aboutData'

export function MissionSection() {
  return <AboutMission text={aboutData.mission} />
}
