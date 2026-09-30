import { MorphIcon as MorphiconsIcon, type MorphIconProps } from 'morphicons/react'

/** Morphs Lucide icon data while honoring the user's reduced-motion setting. */
export default function MorphIcon(props: MorphIconProps) {
  return <MorphiconsIcon {...props} reducedMotion={props.reducedMotion ?? 'user'} />
}
