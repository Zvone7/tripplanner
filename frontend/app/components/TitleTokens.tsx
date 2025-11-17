"use client"

import type { TitleToken } from "../utils/formatters"

interface TitleTokensProps {
  tokens: TitleToken[]
  size?: "default" | "sm"
}

export function TitleTokens({ tokens, size = "default" }: TitleTokensProps) {
  const textSize = size === "sm" ? "text-sm" : "text-base"
  const gap = size === "sm" ? "gap-0.5" : "gap-1"

  return (
    <>
      {tokens.map((token, index) => (
        <span key={`token-${token.key}-${index}`} className={`inline-flex items-center ${gap} ${textSize}`}>
          {token.iconSvg ? (
            <span
              className="inline-flex h-4 w-4"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: token.iconSvg }}
              suppressHydrationWarning
            />
          ) : null}
          <span className={token.emphasize ? "italic" : undefined}>{token.text}</span>
          {index < tokens.length - 1 ? (
            <span className="ml-1 text-muted-foreground" aria-hidden="true">
              ,
            </span>
          ) : null}
        </span>
      ))}
    </>
  )
}
