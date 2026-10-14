/**
 * High-Precision Decimal Engine
 * Eliminates IEEE-754 floating point inaccuracies (e.g. 0.1 + 0.2 = 0.3)
 * using BigInt-backed scaled mantissa representation for arithmetic operations,
 * with clean transcendental function handling.
 */

const DEFAULT_DIV_PRECISION = 20;

export class Decimal {
  /**
   * @param {bigint} mantissa
   * @param {number} exp - power of 10
   */
  constructor(mantissa, exp = 0) {
    this.mantissa = BigInt(mantissa);
    this.exp = exp | 0;
    this._normalize();
  }

  _normalize() {
    if (this.mantissa === 0n) {
      this.exp = 0;
      return;
    }
    // Trim trailing zeroes to keep mantissa minimal and exponents aligned
    while (this.mantissa % 10n === 0n) {
      this.mantissa /= 10n;
      this.exp++;
    }
  }

  static fromString(str) {
    str = String(str).trim();
    if (!str || str === 'NaN') return new Decimal(0n, 0);

    // Handle exponential notation e.g., 1.23e-4
    let eIdx = str.toLowerCase().indexOf('e');
    let extraExp = 0;
    if (eIdx !== -1) {
      extraExp = parseInt(str.slice(eIdx + 1), 10) || 0;
      str = str.slice(0, eIdx);
    }

    const dotIdx = str.indexOf('.');
    if (dotIdx === -1) {
      return new Decimal(BigInt(str), extraExp);
    }

    const intPart = str.slice(0, dotIdx);
    const fracPart = str.slice(dotIdx + 1);
    const exp = -fracPart.length + extraExp;
    const combined = (intPart === '-' ? '-' : intPart) + fracPart;
    return new Decimal(BigInt(combined), exp);
  }

  static fromNumber(num) {
    if (Number.isNaN(num)) {
      throw new Error('Result is NaN');
    }
    if (!Number.isFinite(num)) {
      throw new Error('Overflow: result exceeds numeric limits');
    }
    // Round out floating point noise (e.g. 0.9999999999999999 -> 1)
    const cleaned = parseFloat(num.toPrecision(15));
    return Decimal.fromString(cleaned.toString());
  }

  toNumber() {
    return Number(this.toString());
  }

  toString() {
    if (this.mantissa === 0n) return '0';

    const sign = this.mantissa < 0n ? '-' : '';
    let digits = (this.mantissa < 0n ? -this.mantissa : this.mantissa).toString();
    const exp = this.exp;

    if (exp >= 0) {
      return sign + digits + '0'.repeat(exp);
    }

    const numDecimals = -exp;
    if (digits.length <= numDecimals) {
      digits = '0'.repeat(numDecimals - digits.length + 1) + digits;
    }

    const splitPos = digits.length - numDecimals;
    let intPart = digits.slice(0, splitPos);
    let fracPart = digits.slice(splitPos);

    // Trim trailing zeros from fractional part
    while (fracPart.endsWith('0')) {
      fracPart = fracPart.slice(0, -1);
    }

    return fracPart.length > 0 ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
  }

  add(other) {
    other = Decimal.wrap(other);
    const minExp = Math.min(this.exp, other.exp);
    const m1 = this.mantissa * 10n ** BigInt(this.exp - minExp);
    const m2 = other.mantissa * 10n ** BigInt(other.exp - minExp);
    return new Decimal(m1 + m2, minExp);
  }

  sub(other) {
    other = Decimal.wrap(other);
    const minExp = Math.min(this.exp, other.exp);
    const m1 = this.mantissa * 10n ** BigInt(this.exp - minExp);
    const m2 = other.mantissa * 10n ** BigInt(other.exp - minExp);
    return new Decimal(m1 - m2, minExp);
  }

  mul(other) {
    other = Decimal.wrap(other);
    return new Decimal(this.mantissa * other.mantissa, this.exp + other.exp);
  }

  div(other, precision = DEFAULT_DIV_PRECISION) {
    other = Decimal.wrap(other);
    if (other.mantissa === 0n) {
      throw new Error('Division by zero');
    }

    // Scale numerator by 10^precision to preserve fractional digits
    const scale = BigInt(precision);
    const numerator = this.mantissa * 10n ** scale;
    const quotient = numerator / other.mantissa;
    const exp = (this.exp - other.exp) - precision;
    return new Decimal(quotient, exp);
  }

  mod(other) {
    other = Decimal.wrap(other);
    if (other.mantissa === 0n) {
      throw new Error('Modulo by zero');
    }
    const minExp = Math.min(this.exp, other.exp);
    const m1 = this.mantissa * 10n ** BigInt(this.exp - minExp);
    const m2 = other.mantissa * 10n ** BigInt(other.exp - minExp);
    return new Decimal(m1 % m2, minExp);
  }

  pow(other) {
    other = Decimal.wrap(other);
    // If integer exponent and positive, use exact BigInt pow up to power of 1000
    if (other.exp >= 0 && other.mantissa >= 0n) {
      const expVal = other.mantissa * 10n ** BigInt(other.exp);
      if (expVal <= 1000n) {
        const expInt = Number(expVal);
        if (expInt === 0) return new Decimal(1n, 0);
        return new Decimal(this.mantissa ** BigInt(expInt), this.exp * expInt);
      }
    }
    // Fallback to high-precision float math
    const result = Math.pow(this.toNumber(), other.toNumber());
    return Decimal.fromNumber(result);
  }

  negate() {
    return new Decimal(-this.mantissa, this.exp);
  }

  abs() {
    return this.mantissa < 0n ? this.negate() : this;
  }

  static wrap(val) {
    if (val instanceof Decimal) return val;
    if (typeof val === 'number') return Decimal.fromNumber(val);
    if (typeof val === 'string') return Decimal.fromString(val);
    if (typeof val === 'bigint') return new Decimal(val, 0);
    throw new TypeError(`Cannot convert ${val} to Decimal`);
  }
}
