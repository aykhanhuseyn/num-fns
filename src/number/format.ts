import { DEFAULT_DECIMAL_SEPARATOR, DEFAULT_THOUSANDS_SEPARATOR } from '../shared/constants';
import type { NumberFormatOptions, NumberParseOptions } from '../shared/types';

/**
 * Formats a number using Azerbaijani conventions by default: a space between
 * groups of three digits and a comma between the integer and fractional part.
 *
 * @example
 * formatNumber(1234567.891, { decimals: 2 }); // "1 234 567,89"
 */
export function formatNumber(value: number, options: NumberFormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new RangeError(`formatNumber: value must be finite, received ${value}`);
  }

  const {
    decimals,
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
  } = options;

  const isNegative = value < 0 && value !== 0;
  const absolute = Math.abs(value);
  const fixed = decimals === undefined ? String(absolute) : absolute.toFixed(decimals);
  const [integerDigits, fractionDigits] = fixed.split('.');

  const groupedInteger = groupDigits(integerDigits ?? '0', thousandsSeparator);
  const result = fractionDigits
    ? `${groupedInteger}${decimalSeparator}${fractionDigits}`
    : groupedInteger;

  return isNegative ? `-${result}` : result;
}

/**
 * Parses a string produced by {@link formatNumber} (or an equivalent format)
 * back into a JavaScript number.
 *
 * @example
 * parseNumber("1 234 567,89"); // 1234567.89
 */
export function parseNumber(value: string, options: NumberParseOptions = {}): number {
  const {
    thousandsSeparator = DEFAULT_THOUSANDS_SEPARATOR,
    decimalSeparator = DEFAULT_DECIMAL_SEPARATOR,
  } = options;

  const trimmed = value.trim();
  if (trimmed === '') {
    throw new SyntaxError('parseNumber: cannot parse an empty string');
  }

  const withoutThousands = removeAll(trimmed, thousandsSeparator);
  const normalized =
    decimalSeparator === '.'
      ? withoutThousands
      : withoutThousands.split(decimalSeparator).join('.');

  const numeric = Number(normalized);
  if (Number.isNaN(numeric)) {
    throw new SyntaxError(`parseNumber: unable to parse "${value}" as a number`);
  }

  return numeric;
}

function groupDigits(digits: string, separator: string): string {
  if (separator === '') return digits;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

function removeAll(value: string, token: string): string {
  if (token === '') return value;
  return value.split(token).join('');
}
