
interface _Item<T> { priority: number, value: T };


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
      if (start < array.length && key!(array[start]) === needle) {
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


/**
 * A priority queue is a constantly ordered array of elements. Insert operations will keep
 * the queue in order. The sort order is always ascending.
 */
export class PriorityQueue<T> {
  private _items: _Item<T>[];

  /**
   * Construct an empty priority queue.
   */
  public constructor();

  /**
   * Construct a priority queue of the given items. Unless otherwise specified, the array is copied.
   */
  public constructor(items: _Item<T>[], copy?: boolean);

  /**
   * Construct a priority queue of the given values and a function to return the priority.
   */
  public constructor(values: T[], priority: ((v: T) => number));

  public constructor(arg1?: _Item<T>[] | T[], arg2?: boolean | ((v: T) => number)) {
    if (arg1 === undefined) {
      this._items = [];
    }
    else if (typeof arg2 === 'function') {
      const values = arg1 as T[];
      const priority = arg2 as (v: T) => number;
      this._items = values.map(v => ({priority: priority(v), value: v}));
    }
    else {
      const copy = arg2 as boolean;
      const items = arg1 as _Item<T>[];
      this._items = copy ? [...items] : items;
    }
    this._items.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Read a value from the priority queue by index.
   */
   public get(index: number): T {
    return this._items[index].value;
  }

  /**
   * Read an item from the priority queue by index, allowing you to inspect the value and priority.
   */
   public getItem(index: number): _Item<T> {
    return this._items[index];
  }

  /**
   * Pop the first element from the priority queue. Throws an error if the queue is empty.
   */
   public popFirst(): T {
    if (this.empty()) {
      throw new Error("PriorityQueue is empty");
    }
    const result = this._items[0];
    this._items.splice(0, 1);
    return result.value;
  }

  /**
   * Pop the last element from the priority queue. Throws an error if the queue is empty.
   */
   public popLast(): T {
    if (this.empty()) {
      throw new Error("PriorityQueue is empty");
    }
    return this._items.pop()!.value;
  }

  /**
   * Returns whether the queue is empty.
   */
  public empty(): boolean {
    return this._items.length === 0;
  }

  /**
   * Returns the size of the queue.
   */
  public size(): number {
    return this._items.length;
  }

  /**
   * Finds the index in the queue which would allow the insertion of an item with the specified *priority*
   * without violating the sorted constraint.
   */
  public bisect(priority: number): number {
    return bisect(this._items, priority, item => item.priority);
  }

  /**
   * Add an element to the queue.
   */
  public add(priority: number, value: T): void {
    const idx = this.bisect(priority);
    this._items.splice(idx, 0, {priority, value});
  }

  /**
   * Replace an element in the queue by index with the specified *item*.
   */
  public replace(index: number, priority: number, value: T): void {
    this._items.splice(index, 1);
    this.add(priority, value);
  }

  /**
   * Returns an array of the values in the priority queue in sorted order.
   */
  public values(): T[] {
    return this._items.map(item => item.value);
  }
}
