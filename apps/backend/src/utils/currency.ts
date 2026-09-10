import { Prisma } from '@prisma/client';
import { ValidationError } from './errors.js';

export function toPaise(val: number | string | Prisma.Decimal | bigint | null | undefined, allowZero = false): bigint {
  if (val === undefined || val === null) {
    if (allowZero) return BigInt(0);
    throw new ValidationError(`Amount must be ${allowZero ? 'non-negative' : 'greater than zero'}`);
  }
  if (typeof val === 'bigint') {
    if ((!allowZero && val <= BigInt(0)) || (allowZero && val < BigInt(0))) {
      throw new ValidationError(`Amount must be ${allowZero ? 'non-negative' : 'greater than zero'}`);
    }
    return val;
  }
  let num: number;
  if (val instanceof Prisma.Decimal) {
    num = val.toNumber();
  } else if (typeof val === 'string') {
    num = parseFloat(val);
  } else {
    num = val;
  }
  if (isNaN(num) || (!allowZero && num <= 0) || (allowZero && num < 0)) {
    throw new ValidationError(`Amount must be ${allowZero ? 'non-negative' : 'greater than zero'}`);
  }
  return BigInt(Math.round(num * 100));
}
