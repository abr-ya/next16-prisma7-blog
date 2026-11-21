# Design

## Width Scale

`SITE_CONTENT_WIDTH` gains `content = "max-w-5xl"` between the existing `narrow` (`max-w-3xl`) and `wide` (`max-w-7xl`). The public track surfaces use `content`; the surrounding trips family keeps `wide`.

## Pages

`/tracks` passes `contentWidth="content"` to `PageLayout` and drops its inner `max-w-5xl` wrapper, so the width comes from one place. `/tracks/[slug]` does the same and drops the article's `max-w-3xl`/`mx-auto`/duplicate horizontal padding; the description and private note get `max-w-3xl` locally.

## Risks

- **Long prose.** Handled by the narrow constraint on the two prose blocks.
- **Map proportions.** The map keeps its existing component and height rules; the wider container does not change its aspect handling.
- **Family divergence.** `/trips` stays wider on purpose; aligning it is a later candidate, not part of this layout fix.

## Verification

TypeScript, targeted ESLint, a production build, and `openspec validate`. Visual checks at 375, 768, 1280, and 1440 px: no horizontal overflow, the map keeps its proportions, prose stays readable, and the list reflows.
