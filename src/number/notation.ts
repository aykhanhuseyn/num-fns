import type { LongNotationOptions, ShortNotationOptions } from '../shared/types';
import { SCALE_WORDS } from './words';

const SHORT_SCALES_AZ: ReadonlyArray<readonly [number, string]> = [
  [1e12, 'trln'],
  [1e9, 'mlrd'],
  [1e6, 'mln'],
  [1e3, 'min'],
];

const SHORT_SCALES_EN: ReadonlyArray<readonly [number, string]> = [
  [1e12, 'T'],
  [1e9, 'B'],
  [1e6, 'M'],
  [1e3, 'K'],
];

/**
 * Abbreviates a large number to a short scaled form.
 *
 * @example
 * toShortNotation(1500); // "1,5 min"
 * toShortNotation(2500000, { locale: 'en' }); // "2.5M"
 */
export function toShortNotation(value: number, options: ShortNotationOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`toShortNotation: value must be finite, received ${value}`);
  }

  const { decimals = 1, locale = 'az', decimalSeparator = locale === 'az' ? ',' : '.' } = options;
  const isNegative = value < 0 && value !== 0;
  const absolute = Math.abs(value);
  const scales = locale === 'az' ? SHORT_SCALES_AZ : SHORT_SCALES_EN;
  const sign = isNegative ? '-' : '';

  for (const [threshold, suffix] of scales) {
    if (absolute >= threshold) {
      const scaled = trimTrailingZeros((absolute / threshold).toFixed(decimals)).replace(
        '.',
        decimalSeparator,
      );
      const spacer = locale === 'az' ? ' ' : '';
      return `${sign}${scaled}${spacer}${suffix}`;
    }
  }

  return `${sign}${absolute.toFixed(0)}`;
}

function trimTrailingZeros(fixed: string): string {
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/0+$/, '').replace(/\.$/, '');
}

const MAX_SUPPORTED_INTEGER = 1000 ** SCALE_WORDS.length - 1;

/**
 * Expands an integer into digit groups paired with their Azerbaijani scale
 * word, without spelling every number out — e.g. `1234567` becomes
 * `"1 milyon 234 min 567"`.
 *
 * @example
 * toLongNotation(1234567); // "1 milyon 234 min 567"
 */
export function toLongNotation(value: number, options: LongNotationOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`toLongNotation: value must be finite, received ${value}`);
  }
  if (!Number.isInteger(value)) {
    throw new TypeError(`toLongNotation: value must be an integer, received ${value}`);
  }

  const { groupSeparator = ' ' } = options;
  const isNegative = value < 0 && value !== 0;
  const absolute = Math.abs(value);

  if (absolute > MAX_SUPPORTED_INTEGER) {
    throw new RangeError(
      `toLongNotation: value exceeds the maximum supported magnitude of ${MAX_SUPPORTED_INTEGER}`,
    );
  }
  if (absolute === 0) return '0';

  const groups: number[] = [];
  let remaining = absolute;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupValue = groups[i];
    if (!groupValue) continue;
    const scaleWord = SCALE_WORDS[i];
    parts.push(scaleWord ? `${groupValue} ${scaleWord}` : `${groupValue}`);
  }

  return `${isNegative ? '-' : ''}${parts.join(groupSeparator)}`;
}
