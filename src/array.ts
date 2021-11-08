
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
