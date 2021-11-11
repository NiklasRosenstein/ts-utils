/**
 * Optional class.
 */

/**
 * A simple optional value container.
 */
 export class Optional<T> {
  public constructor(private value?: T) { }

  public get(): T {
    if (this.value === undefined) {
      throw new Error("Optional is empty");
    }
    return this.value;
  }

  public or(fallback: T): T {
    return this.value === undefined ? fallback : this.value;
  }

  public map<R>(func: (value: T) => R): Optional<R> {
    return new Optional(this.value === undefined ? undefined : func(this.value));
  }

}
