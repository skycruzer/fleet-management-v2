import { publicMetadata } from '@/lib/utils/metadata'
import { AnimatedLandingContent } from '@/components/landing/animated-landing-content'

export const metadata = publicMetadata.home

export default function HomePage() {
  return <AnimatedLandingContent />
}
