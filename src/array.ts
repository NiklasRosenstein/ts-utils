/**
 * Common functions to generate and process arrays.
 */

/**
 * Create an array of numbers starting with *start*, counting *step* until reaching *stop*
 * (exclusively).
 */
export function arange(start: number, stop: number, step: number = 1): number[] {
  const result = [];
  for (let i = start; i < stop; i += step) {
      result.push(i);
  }
  return result;
}

/**
 * Flatmap a generator function over an array. This is a nicer way of writing
 *
 * ```ts
 * arr.flatMap(item => [...func(item)]);
 * ```
 */
export function gflat<R, T>(arr: T[], func: (item: T) => Iterable<R>): R[] {
  return arr.flatMap(item => [...func(item)]);
}
