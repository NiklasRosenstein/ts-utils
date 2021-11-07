
type MapFunction<R, T> = (value: T, index: number) => R;
type ReduceFunction<R, V> = (agg: R, value: V, index: number) => R;
type ComparatorFunction<T> = (a: T, b: T) => number;
type Row = {[k: string]: any};

/**
 * Repeat the value n times.
 */
function repeat<T>(value: T | (() => T), n: number): T[] {
  const result = [];
  const make = (typeof value === 'function' ? value : () => value) as (() => T);
  for (let i = 0; i < n; ++i) {
    result.push(make());
  }
  return result;
}

/**
 * Represents a series of data.
 */
export class Series<T> {

  /** @internal */
  public data: T[];
  /** @internal */
  public name: string | undefined;
  /** @internal */
  public owner: DataFrame | undefined;

  public constructor(data?: T[], name?: string, owner?: DataFrame) {
    this.data = data || [];
    this.name = name;
    this.owner = owner;
  }

  /** @internal */
  public assertUnowned(operation: string): void {
    if (this.owner !== undefined) {
      throw new Error("individual operation \"" + operation +
                      "\" cannot be performed for a Series attached to a DataFrame");
    }
  }

  private wrapIndex(index: number): number {
    if (index < 0) {
      return this.data.length + index;
    }
    return index;
  }

  private checkIndex(index: number): number {
    index = this.wrapIndex(index);
    if (index >= this.data.length) {
      throw new Error("index \"" + index + "\" is out of range");
    }
    return index;
  }

  /**
   * Append values to the series.
   *
   * This cannot be called when the series is attached to a {@link DataFrame}.
   */
  public append(...values: T[]): void {
    this.assertUnowned("append");
    this.data.push(...values);
  }

  /**
   * Remove the last value from the series.
   *
   * This cannot be called when the series is attached to a {@link DataFrame}.
   */
  public pop(): T | undefined {
    this.assertUnowned("pop");
    if (this.data === []) {
      return undefined;
    }
    return this.data.pop();
  }

  /**
   * Remove an element from the array by index.
   *
   * This cannot be called when the series is attached to a {@link DataFrame}.
   */
  public popIndex(index: number): void {
    this.assertUnowned("popIndex");
    this.data.splice(this.checkIndex(index), 1);
  }

  /**
   * Remove all elements from the series.
   *
   * This cannot be called when the series is attached to a {@link DataFrame}.
   */
  public clear(): void {
    this.assertUnowned("clear");
    this.data = [];
  }

  /**
   * Create a sorted copy of the series.
   *
   * This can not be called when the series is owned by a {@link DataFrame}.
   */
  public sort(func?: ComparatorFunction<T>): void {
    this.assertUnowned("sort");
    this.data.sort(func);
  }

  /**
   * Filter the series by a predicate and returns a copy.
   */
  public filter(predicate: MapFunction<boolean, T>): Series<T> {
    return new Series(this.data.filter(predicate));
  }

  /**
   * Create a copy of the series, but drops the name and owner.
   */
   public copy(): Series<T> {
    return new Series(this.data, this.name);
  }

  /**
   * Return the size of the series.
   */
  public size(): number {
    return this.data.length;
  }

  /**
   * Get an item from the series by index. Negative values access the series from behind.
   */
  public get(index: number): T {
    return this.data[this.checkIndex(index)];
  }

  /**
   * Set an item value by index.
   */
  public set(index: number, value: T): void {
    this.data[this.checkIndex(index)] = value;
  }

  /**
   * Find an element in the series by predicate.
   */
  public find(func: MapFunction<boolean, T>, start?: number, stop?: number): T | undefined {
    if (start === undefined && stop === undefined) {
      return this.data.find(func);
    }
    else {
      const index = this.indexOf(func, start, stop);
      return index < 0 ? undefined : this.data[index];
    }
  }

  /**
   * Returns the index of an element in the series by a value or predicate. -1 is
   * returned if the value is not found.
   */
  public indexOf(arg: T | MapFunction<boolean, T>, start?: number, stop?: number): number {
    if (typeof arg === 'function') {
      stop = Math.min(stop || this.data.length, this.data.length);
      for (let i = this.wrapIndex(start || 0); i < this.wrapIndex(stop); ++i) {
        if ((arg as MapFunction<boolean, T>)(this.data[i], i)) {
          return i;
        }
      }
      return -1;
    }
    return this.data.indexOf(arg);
  }

  /**
   * Run the function for each value.
   */
  public forEach(func: MapFunction<void, T>, start?: number, stop?: number): void {
    stop = Math.min(stop || this.data.length, this.data.length);
    for (let i = this.wrapIndex(start || 0); i < this.wrapIndex(stop); ++i) {
      func(this.data[i], i);
    }
  }

  /**
   * Create a copy of the series with the mapped values.
   */
  public map<R>(func: MapFunction<R, T>): Series<R> {
    return new Series(this.data.map(func));
  }

  /**
   * Create a new series flat-mapped from the function.
   */
  public flatMap<R>(func: MapFunction<R[], T>): Series<R> {
    return new Series(this.data.flatMap(func));
  }

  /**
   * Reduce values in the series.
   */
   public reduce<R>(func: ReduceFunction<R, T>, initial: R): R {
    return this.data.reduce(func, initial);
  }

  /**
   * Calculate the sum of all elements in the series. The series must contain numbers.
   */
  public sum(): number {
    return (this as unknown as Series<number>).reduce((agg, v) => agg + (v || 0.0), 0.0);
  }

  /**
   * Calculate the mean of all elements in the series. The series must contain numbers.
   * Returns zero if the series is empty.
   */
  public mean(): number {
    if (this.data.length === 0) {
      return 0;
    }
    return this.sum() / this.data.length;
  }

  /**
   * Returns the median value of the series. The series must contain numbers. A copy of the
   * series data will be sorted for this operation. Returns zero if the series is empty.
   */
  public median(): number {
    if (this.data.length === 0) {
      return 0;
    }
    const data = [...this.data];
    data.sort();
    return data[data.length / 2] as unknown as number;
  }

  /**
   * Calculates the variance of the series. The series must contain values.
   */
  public variance(): number {
    const mean = this.mean();
    return (this as unknown as Series<number>).reduce((agg, v) => agg + Math.pow(mean - v, 2), 0.0);
  }

  /**
   * Calculates the standard deviation of the series. The series must contain values.
   */
  public stddev(): number {
    return Math.sqrt(this.variance());
  }

}

/**
 * Represents tabular data.
 */
export class DataFrame {
  private data: {[k: string]: Series<any>};

  public constructor(rows?: any[][] | Row[], columnNames?: string[]) {
    const fixedColumnNames = columnNames !== undefined;
    let series: Series<any>[] = [];
    rows = rows || [];

    for (let i = 0; i < rows.length; ++i) {
      let row = rows[i];

      if (!Array.isArray(row)) {
        if (columnNames === undefined) {
          columnNames = Object.keys(row);
        }
        else if (!fixedColumnNames) {
          columnNames = [...columnNames, ...Object.keys(row).filter(k => !columnNames!.includes(k))];
        }
        row = columnNames.map(k => row[k]);
      }

      // Make sure we have enough series to hold the values of this row.
      if (row.length > series.length) {
        series = [
          ...series,
          ...repeat(
            () => new Series(repeat(undefined, i)),
            row.length - series.length
          )
        ]
      }

      // Append the current row to the series'.
      row.map((v: any, i: number) => series[i].append(v));
    }

    if (columnNames === undefined) {
      columnNames = series.map((_, i) => '_' + (i + 1));
    }

    this.data = {};
    series.map((s, i) => {
      s.name = columnNames![i];
      s.owner = this;
      this.data[s.name] = s;
    });
  }

  private checkColumn(name: string): void {
    if (this.data[name] === undefined) {
      throw new Error("column \"" + name + "\" does not exist in the dataframe");
    }
  }

  /**
   * Returns the number of rows in the dataframe.
   */
  public size(): number {
    if (this.data === {}) {
      return 0;
    }
    return Object.values(this.data)[0].size();
  }

  /**
   * Return the column names present in the dataframe.
   */
  public columnNames(): string[] {
    return Object.keys(this.data);
  }

  /**
   * Retrieve a column from the dataframe as a series.
   */
  public column(name: string): Series<any> {
    this.checkColumn(name);
    return this.data[name];
  }

  /**
   * Replace a column by name.
   */
   public setColumn(name: string, series: Series<any>): void {
    series.assertUnowned("DataFrame.setColumn");
    this.checkColumn(name);
    if (series.size() != this.size()) {
      throw new Error("incoming Series size (" + series.size() +
                      ") differs from DataFrame size (" + this.size() + ")");
    }
    const old = this.data[name];
    old.name = undefined;
    old.owner = undefined;
    series.name = name;
    series.owner = this;
    this.data[name] = series;
  }

  /**
   * Retrieve a row from this dataframe as an object.
   */
  public row(index: number): Row {
    return Object.values(this.data).reduce((a, s) => ({...a, [s.name!]: s.get(index)}), {});
  }

  /**
   * Set a row in the dataframe.
   */
  public setRow(index: number, row: Row) {
    Object.values(this.data).forEach(s => s.set(index, row[s.name!]));
  }

}
