import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeJsonParse<T = any>(text: string): T {
  if (!text) throw new Error("Empty response text from AI");

  let cleaned = text.trim();

  // 1. Extract content inside markdown code blocks if present
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (markdownMatch && markdownMatch[1]) {
    cleaned = markdownMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  // 2. Extract substring between first '{' and last '}'
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (e1: any) {
    // Attempt 1: Fix unescaped double quotes inside Hebrew words (e.g. חב"ד, בס"ד)
    try {
      const fixedHebrewQuotes = cleaned
        .replace(/([\u0590-\u05FF])"([\u0590-\u05FF])/g, '$1\\"$2')
        .replace(/([\u0590-\u05FF])"(\s|[,\}\]\:])/g, '$1\\"$2');
      return JSON.parse(fixedHebrewQuotes);
    } catch (e2) {
      // Attempt 2: Replace unescaped newlines within JSON string property values
      try {
        const fixedNewlines = cleaned.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, "\\n");
        return JSON.parse(fixedNewlines);
      } catch (e3) {
        throw new Error(`AI JSON parse error: ${e1.message}`);
      }
    }
  }
}

