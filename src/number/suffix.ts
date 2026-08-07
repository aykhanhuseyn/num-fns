import type { SuffixOptions } from '../shared/types';
import { numberToWords } from './words';

/**
 * Maps the last vowel of an Azerbaijani number word to the correct ordinal
 * suffix, following vowel harmony: back unrounded (a, ı) -> "cı", front
 * unrounded (e, ə, i) -> "ci", back rounded (o, u) -> "cu", front rounded
 * (ö, ü) -> "cü".
 */
const VOWEL_TO_ORDINAL_SUFFIX: Record<string, string> = {
  a: 'cı',
  ı: 'cı',
  e: 'ci',
  ə: 'ci',
  i: 'ci',
  o: 'cu',
  u: 'cu',
  ö: 'cü',
  ü: 'cü',
};

function lastVowel(word: string): string {
  for (let i = word.length - 1; i >= 0; i--) {
    const char = word[i] as string;
    if (char in VOWEL_TO_ORDINAL_SUFFIX) return char;
  }
  throw new SyntaxError(`lastVowel: no Azerbaijani vowel found in "${word}"`);
}

/**
 * Returns the Azerbaijani ordinal suffix ("cı" | "ci" | "cu" | "cü") for a
 * non-negative integer, chosen by vowel harmony on the last word of its
 * cardinal reading (see {@link numberToWords}).
 *
 * @example
 * getOrdinalSuffix(1); // "ci"  (bir -> birinci)
 * getOrdinalSuffix(9); // "cu"  (doqquz -> doqquzuncu)
 */
export function getOrdinalSuffix(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(
      `getOrdinalSuffix: value must be a non-negative integer, received ${value}`,
    );
  }

  const words = numberToWords(value);
  const lastWord = words.split(' ').pop() as string;
  return VOWEL_TO_ORDINAL_SUFFIX[lastVowel(lastWord)] as string;
}

/**
 * Formats a non-negative integer as an Azerbaijani ordinal, e.g. `5` becomes
 * `"5-ci"`.
 *
 * @example
 * toOrdinal(3); // "3-cü"
 * toOrdinal(21); // "21-ci"
 */
export function toOrdinal(value: number, separator = '-'): string {
  return `${value}${separator}${getOrdinalSuffix(value)}`;
}

/**
 * Attaches an arbitrary suffix to a value, e.g. a unit or label.
 *
 * @example
 * withSuffix(120, 'kg'); // "120 kg"
 * withSuffix(5, '-cı', { separator: '' }); // "5-cı"
 */
export function withSuffix(
  value: number | string,
  suffix: string,
  options: SuffixOptions = {},
): string {
  const { separator = ' ' } = options;
  return `${value}${separator}${suffix}`;
}
