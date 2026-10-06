import type { MarkdownSection } from './markdown-sections.ts'

const mentionPatternOf = (term: string): RegExp =>
  new RegExp(String.raw`(?<![\w$-])${RegExp.escape(term)}(?![\w-])`, 'g')

const TITLE_MENTION_WEIGHT = 10

const mentionCountIn = (text: string, terms: readonly string[]): number =>
  terms.reduce(
    (count, term) => count + (text.match(mentionPatternOf(term))?.length ?? 0),
    0
  )

/** A mention in the heading outweighs any number in passing. */
const relevanceOf = (
  section: MarkdownSection,
  terms: readonly string[]
): number =>
  TITLE_MENTION_WEIGHT * mentionCountIn(section.title ?? '', terms) +
  mentionCountIn(section.markdown, terms)

type Candidate<TSection> = { relevance: number; section: TSection }

/** A titled section beats the opening text; then the one naming the export more. */
const outranks = <TSection extends MarkdownSection>(
  challenger: Candidate<TSection>,
  holder: Candidate<TSection>
): boolean => {
  const isChallengerTitled = challenger.section.title !== null
  const isHolderTitled = holder.section.title !== null

  if (isChallengerTitled !== isHolderTitled) {
    return isChallengerTitled
  }

  return challenger.relevance > holder.relevance
}

/**
 * The section that explains an export: the titled one that names any of its
 * `terms` most, the earliest on a tie, else the opening text when that names
 * it. `null` when no section does.
 */
export const explainingSectionOf = <TSection extends MarkdownSection>({
  sections,
  terms
}: {
  sections: readonly TSection[]
  terms: readonly string[]
}): TSection | null => {
  let best: Candidate<TSection> | null = null

  for (const section of sections) {
    const candidate = { relevance: relevanceOf(section, terms), section }

    if (
      candidate.relevance > 0 &&
      (best === null || outranks(candidate, best))
    ) {
      best = candidate
    }
  }

  return best?.section ?? null
}
