# LevelUP Math UX principles

## Product feeling

LevelUP Math should feel like a guided learning product, not an internal dashboard presented to students.

- **Public:** aspirational, clear, energetic, trustworthy.
- **Student:** personal learning companion; always answers “what should I do next?”
- **Admin:** dense professional content studio.
- **Reviewer:** focused quality-control workspace.

## Structural rules

1. Public, student, admin, and reviewer experiences use different shells.
2. Student desktop navigation is horizontal; mobile navigation is bottom-mounted.
3. Admin/reviewer may use denser sidebar navigation because they are productivity tools.
4. Assessment/exam mode removes normal navigation.
5. One screen has one dominant purpose and one clear primary action.
6. Avoid card-inside-card layouts and repetitive equal-card grids unless the content genuinely needs comparison.
7. Unknown mastery is “Belum diukur”, never mastery 0.
8. Completed states replace onboarding CTAs. A completed diagnostic does not keep presenting “Mulai Diagnostik” as the primary action.
9. Logout always leaves the protected workspace and produces visible confirmation.
10. Internal QA/release terminology does not appear in the student experience.

## Visual language

**Modern Academic Energy**

- deep/primary red = brand, action, active state
- warm gold = sparing emphasis and achievement
- off-white/warm neutral = canvas
- charcoal = typography
- no default purple/blue AI gradient language
- restrained radii; not every element is a pill
- typography and whitespace create hierarchy before borders/shadows
- motion is functional: hover, progress, state change; no decorative motion in admin workflows

## Product boundaries

UI work must not change trusted scoring, server timers, immutable attempt snapshots, mastery logic, question versioning, review policy, publishing rules, or role authorization.
