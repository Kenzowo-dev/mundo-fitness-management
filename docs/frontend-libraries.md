# Frontend libraries

The frontend uses the following foundations for the planned interface refresh:

- **Howler.js** (`howler`) handles audio playback. Keep sound opt-in to a deliberate user action; do not autoplay sounds or attach sounds to frequent actions. No audio assets or sound cues are enabled yet.
- **Lucide icon data** (`lucide`) supplies tree-shakeable SVG path data, and **Morphicons** (`morphicons`) animates state changes between compatible icons. Import the `MorphIcon` adapter from `src/components/MorphIcon.tsx`; it honors the device's reduced-motion preference by default. Supply a `label` only when an icon conveys information without adjacent text.
- **Motion** (`motion`) is available for interactions that need layout, exit, gesture, or spring animation. The app root already wraps the interface in `MotionConfig reducedMotion="user"`. Use CSS for simple hover, focus, and press feedback.

These dependencies do not add automatic audio or motion to the current flows. Add them when the corresponding interaction is redesigned, with a clear feedback purpose and a reduced-motion or silent path where applicable.
