/**
 * SVG module declaration — enables importing SVGs as React components.
 * Works with @svgr/webpack configured in next.config.js (turbopack rules).
 *
 * Usage:
 *   import AirplaneIcon from '@/public/icons/airplane.svg'
 *   <AirplaneIcon className="h-6 w-6 text-primary" />
 */
declare module '*.svg' {
  import { FC, SVGProps } from 'react'
  const content: FC<SVGProps<SVGElement>>
  export default content
}
