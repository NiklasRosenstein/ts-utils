/**
 * An asortment helper functions.
 */

/**
 * Take *fallback* if *val* is `undefined` or `null`, otherwise take *val*.
 */
export function coalesce<T>(val: T | undefined | null, fallback: T): T {
  if (val === undefined || val === null) {
    return fallback;
  }
  return val;
}


/**
 * Take the result of *fallback* if *val* is `undefined` or `null`, otherwise take *val*.
 */
export function coalescef<T>(val: T | undefined | null, fallback: () => T): T {
  if (val === undefined || val === null) {
    return fallback();
  }
  return val;
}


/**
 * Map the specified value, or return the *fallback* if the original value or the map result is undefined.
 */
export function coalescemf<R, T>(val: T | undefined | null, map: (x: T) => R | undefined, fallback: () => R): R {
  if (val === undefined || val === null) {
    return fallback();
  }
  return coalescef(map(val), fallback);
}


/**
 * Create an array of numbers starting with *start*, counting *step* until reaching *stop*
 * (exclusively).
 */
export function range(start: number, stop: number, step: number = 1): number[] {
  const result = [];
  for (let i = start; i < stop; i += step) {
      result.push(i);
  }
  return result;
}


/**
 * Flatten the results from a generator mapped over the items of an array.
 *
 * ```ts
 * arr.flatMap(item => [...func(item)]);
 * ```
 */
 export function flatMapGenerator<R, T>(arr: T[], func: (item: T) => Iterable<R>): R[] {
  return arr.flatMap(item => [...func(item)]);
}
