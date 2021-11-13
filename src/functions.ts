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


/**
 * Finds the index in the *array* of which the value is in most casesa strictly lower than *needle*, or
 * 0 if the value is equal to the first element of the sorted *array*. If the needle is greater than any
 * value in the array, the length of the array is returned.
 *
 * Examples:
 *
 * ```ts
 * bisect([1, 4, 7], 0) == 0
 * bisect([1, 4, 7], 1) == 1
 * bisect([1, 4, 7], 3) == 1
 * bisect([1, 4, 7], 4) == 2
 * bisect([1, 4, 7], 7) == 3
 * bisect([1, 4, 7], 8) == 3
 */
export function bisect<T>(array: readonly number[], needle: number): number;
export function bisect<T>(array: readonly T[], needle: number, key: ((t: T) => number)): number;
export function bisect<T>(array: readonly T[], needle: number, key?: ((t: T) => number)): number {
  // Fall back to assuming the input array consists of numbers.
  if (key === undefined) {
    key = (x: T) => x as unknown as number;
  }

  // Recursive binary search function.
  function search(start: number, end: number): number {
    if (start === end) {
      if (key!(array[start]) === needle) {
        return start + 1;
      }
      return start;
    }
    const middle = start + Math.floor((end - start) / 2);
    const value = key!(array[middle]);
    if (value < needle) {
      return search(Math.min(middle + 1, end), end);
    }
    else if (value > needle) {
      return search(start, middle);
    }
    else {
      return middle + 1;
    }
  };

  return search(0, array.length);
}
