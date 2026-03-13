import { AboutVision } from '../components/AboutVision'
import { aboutData } from '../data/aboutData'

export function VisionSection() {
  return <AboutVision text={aboutData.vision} />
}
