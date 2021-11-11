/**
 * Common helper functions.
 */

/**
 * Take *fallback* if *val* is `undefined` or `null`, otherwise take *val*.
 */
function coalesce<T>(val: T | undefined | null, fallback: T): T {
  if (val === undefined || val === null) {
    return fallback;
  }
  return val;
}
