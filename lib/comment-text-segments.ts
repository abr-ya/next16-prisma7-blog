export type CommentTextSegment =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "link";
      text: string;
      href: string;
    };

const WEB_URL_PATTERN = /(^|[\s([{])((?:https?:\/\/|www\.)[^\s<>"']+)/gi;
const TRAILING_PUNCTUATION_PATTERN = /[.,!?;:]+$/;
const CLOSING_BRACKETS: Record<string, string> = {
  ")": "(",
  "]": "[",
  "}": "{",
};

const countCharacter = (value: string, character: string) => {
  let count = 0;

  for (const currentCharacter of value) {
    if (currentCharacter === character) count += 1;
  }

  return count;
};

const splitTrailingText = (value: string) => {
  let linkText = value;
  let trailingText = "";

  let didTrim = true;

  while (linkText.length > 0 && didTrim) {
    didTrim = false;

    const punctuationMatch = linkText.match(TRAILING_PUNCTUATION_PATTERN);

    if (punctuationMatch) {
      const punctuation = punctuationMatch[0];
      linkText = linkText.slice(0, -punctuation.length);
      trailingText = `${punctuation}${trailingText}`;
      didTrim = true;
    }

    const lastCharacter = linkText.at(-1);
    const openingBracket = lastCharacter ? CLOSING_BRACKETS[lastCharacter] : undefined;

    if (!lastCharacter || !openingBracket) continue;

    const hasUnmatchedClosingBracket =
      countCharacter(linkText, lastCharacter) > countCharacter(linkText, openingBracket);

    if (!hasUnmatchedClosingBracket) continue;

    linkText = linkText.slice(0, -1);
    trailingText = `${lastCharacter}${trailingText}`;
    didTrim = true;
  }

  return { linkText, trailingText };
};

const toSafeWebHref = (value: string) => {
  const href = value.toLowerCase().startsWith("www.") ? `https://${value}` : value;

  try {
    const url = new URL(href);

    if (url.protocol !== "http:" && url.protocol !== "https:") return null;

    return url.href;
  } catch {
    return null;
  }
};

export const getCommentTextSegments = (value: string): CommentTextSegment[] => {
  const segments: CommentTextSegment[] = [];
  let lastIndex = 0;

  for (const match of value.matchAll(WEB_URL_PATTERN)) {
    const prefix = match[1] ?? "";
    const matchedText = match[2] ?? "";
    const startIndex = (match.index ?? 0) + prefix.length;
    const { linkText, trailingText } = splitTrailingText(matchedText);
    const href = linkText ? toSafeWebHref(linkText) : null;

    if (!href) continue;

    if (startIndex > lastIndex) {
      segments.push({ type: "text", text: value.slice(lastIndex, startIndex) });
    }

    segments.push({ type: "link", text: linkText, href });

    if (trailingText) {
      segments.push({ type: "text", text: trailingText });
    }

    lastIndex = startIndex + matchedText.length;
  }

  if (lastIndex < value.length) {
    segments.push({ type: "text", text: value.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", text: value }];
};
