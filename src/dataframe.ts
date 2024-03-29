
import * as mas from "multiple-array-sorter";
import { coalesce } from "./functions"

type MapFunction<R, T> = (value: T, index: number) => R;
type ReduceFunction<R, V> = (agg: R, value: V, index: number) => R;
type ComparatorFunction<T> = (a: T, b: T) => number;
type Row = {[k: string]: any};
type SeriesMap = {[k: string]: Series<any>};
type SeriesOrValueMap = {[k: string]: Series<any> | any};

interface SortProps {
  inplace?: boolean,
  sortOrder?: 'asc' | 'desc',
}

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
export class Series<T> implements Iterable<T> {

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

  [Symbol.iterator](): Iterator<T> {
    return this.data[Symbol.iterator]();
  }

  /** @internal */
  public withUnowned<R>(func: () => R): R {
    const temp = {owner: this.owner, name: this.name};
    this.owner = this.name = undefined;
    try {
      return func();
    }
    finally {
      this.owner = temp.owner;
      this.name = temp.name;
    }
  }

  /** @internal */
  public assertUnowned(operation: string): void {
    if (this.owner !== undefined) {
      throw new Error("individual operation \"" + operation +
                      "\" cannot be performed for a Series attached to a DataFrame");
    }
  }

  private assertNotEmpty(): void {
    if (this.data === []) {
      throw new Error("series is empty");
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
   * Rename the same series.
   *
   * This cannot be called when the series is attached to a {@link DataFrame}.
   */
  public named(name?: string): Series<T> {
    this.assertUnowned("named");
    this.name = name;
    return this;
  }

  /**
   * Append values to the series.
   *
   * This cannot be called when the series is attached to a {@link DataFrame}.
   */
  public append(...values: T[]): Series<T> {
    this.assertUnowned("append");
    this.data.push(...values);
    return this;
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
      stop = Math.min(coalesce(stop, this.data.length), this.data.length);
      for (let i = this.wrapIndex(coalesce(start, 0)); i < this.wrapIndex(stop); ++i) {
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
    stop = Math.min(coalesce(stop, this.data.length), this.data.length);
    for (let i = this.wrapIndex(coalesce(start, 0)); i < this.wrapIndex(stop); ++i) {
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
   * Convert the series to a standard array.
   */
  public toArray(): T[] {
    return [...this.data];
  }

  /**
   * Calculates the minimum value of all elements in the series. If no comparator is given,
   * the series must contain numbers. Throws an error if the series is empty.
   */
  public min(func?: ComparatorFunction<T>): T {
    if (func === undefined) {
      return (this as unknown as Series<number>).max((a, b) => b - a) as unknown as T;
    }
    return this.max((a, b) => func(b, a));
  }

  /**
   * Calculate the maximum value of all elements in the series. If no comparator is given,
   * the series must contain numbers. Throws an error if the series is empty.
   */
  public max(func?: ComparatorFunction<T>): T {
    this.assertNotEmpty();
    if (func === undefined) {
      return (this as unknown as Series<number>).max((a, b) => a - b) as unknown as T;
    }
    let current = this.data[0];
    for (let i = 1; i < this.data.length; ++i) {
      if (func(current, this.data[i]) < 0) {
        current = this.data[i];
      }
    }
    return current;
  }

  /**
   * Combine with another series of the same length.
   */
  public zip<U, R>(other: Series<U>, f: (a: T, b: U) => R): Series<R> {
    if (this.size() != other.size()) {
      throw new Error(`cannot zip() series of different sizes (left: ${this.size()}), right: ${other.size()})`);
    }
    return this.map((v, idx) => f(v, other.get(idx)));
  }

  /**
   * Calculate the sum of all elements in the series. The series must contain numbers.
   */
  public sum(): number {
    return (this as unknown as Series<number>).reduce((agg, v) => agg + coalesce(v, 0), 0.0);
  }

  /**
   * Calculate the cumulative sum of all elements. The series must contain numbers.
   */
  public cumulativeSum(): Series<number> {
    return (this as unknown as Series<number>).reduce(
      (s, v) => s.append((s.size() === 0 ? 0 : s.get(-1)) + coalesce(v, 0)),
      new Series<number>()
    );
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
    return data[Math.floor(data.length / 2)] as unknown as number;
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
  private data: SeriesMap = {};

  public constructor(data?: any[][] | Row[] | SeriesMap, columnNames?: string[]) {
    if (Array.isArray(data)) {
      this.fromArray(data, columnNames);
    }
    else if (data !== undefined) {
      let size: number | undefined = undefined;
      Object.entries(data).forEach(entry => {
        if (size === undefined) size = entry[1].size();
        if (size != entry[1].size()) {
          throw new Error("mismatching series size");
        }
      });
      Object.entries(data).forEach(entry => {
        entry[1].assertUnowned("DataFrame()");
        entry[1].name = entry[0];
        entry[1].owner = this;
      });
      this.data = data;
    }
  }

  private fromArray(rows: any[][] | Row[], columnNames?: string[]): void {
    const fixedColumnNames = columnNames !== undefined;
    let series: Series<any>[] = [];

    for (let i = 0; i < rows.length; ++i) {
      let row = rows[i];

      if (!Array.isArray(row)) {
        if (columnNames === undefined) {
          columnNames = Object.keys(row);
        }
        else if (!fixedColumnNames) {
          columnNames = [...columnNames, ...Object.keys(row).filter(k => !columnNames!.includes(k))];
        }
        row = columnNames.map(k => (row as Row)[k]);
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
    else if (series.length === 0 && columnNames.length > 1) {
      series = columnNames.map(n => new Series<any>().named(n));
    }

    this.data = {};
    series.map((s, i) => {
      s.name = columnNames![i];
      s.owner = this;
      this.data[s.name] = s;
    });
  }

  private checkColumn(name: string): void {
    if (!this.hasColumn(name)) {
      throw new Error("column \"" + name + "\" does not exist in the dataframe");
    }
  }

  private resolveColumn(column: string | Series<any>): Series<any> {
    if (typeof column === 'string') {
      column = this.column(column);
    }
    else if (column.size() != this.size()) {
      throw new Error("column size does not match dataframe size");
    }
    return column;
  }

  /**
   * Returns the number of rows in the dataframe.
   */
  public size(): number {
    const serieses = Object.values(this.data);
    if (serieses.length === 0) {
      return 0;
    }
    return serieses[0].size();
  }

  /**
   * Returns true if the dataframe is empty.
   */
  public empty(): boolean {
    return this.size() === 0;
  }

  /**
   * Return the column names present in the dataframe.
   */
  public columnNames(): string[] {
    return Object.keys(this.data);
  }

  /**
   * Returns true if the dataframe has a column with the given name.
   */
  public hasColumn(name: string): boolean {
    return this.data[name] !== undefined;
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
  public setColumn(name: string, series: Series<any>, toFront: boolean = false): void {
    series.assertUnowned("DataFrame.setColumn");
    if (series.size() != this.size()) {
      throw new Error("incoming Series size (" + series.size() +
                      ") differs from DataFrame size (" + this.size() + ")");
    }
    if (this.hasColumn(name)) {
      const old = this.data[name];
      old.name = undefined;
      old.owner = undefined;
      series.name = name;
      series.owner = this;
      this.data[name] = series;
    }
    else {
      series.name = name;
      series.owner = this;
      this.data[name] = series;
    }
    if (toFront) {
      this.data = Object.fromEntries([
        ...Object.entries(this.data).filter(e => e[0] === name),
        ...Object.entries(this.data).filter(e => e[0] !== name)]);
    }
  }

  /**
   * Drop a column from the dataframe.
   */
  public drop(names: string | string[], inplace: boolean = false): DataFrame {
    if (!Array.isArray(names)) names = [names];
    names.forEach(name => this.checkColumn(name));
    const self = inplace ? this : this.copy();
    names.forEach(name => {
      const series = self.data[name];
      delete self.data[name];
      series.owner = undefined;
    });
    return self;
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

  /**
   * Remove a row from the dataframe.
   */
  public removeRow(rowIdx: number): DataFrame {
    Object.values(this.data).forEach(s => s.withUnowned(() => s.popIndex(rowIdx)));
    return this;
  }

  /**
   * Create a copy of the dataframe.
   */
  public copy(): DataFrame {
    return this.slice(0, this.size());
  }

  /**
   * Slice the rows of the dataframe in the given range.
   */
  public slice(start: number, stop: number): DataFrame {
    const rows = Object.values(this.data)[0].data
      .map((_, rowIdx) => rowIdx)
      .slice(start, stop)
      .map(rowIdx => this.row(rowIdx));
    return new DataFrame(rows);
  }

  /**
   * Union this and the other dataframe. The resulting dataframe is wider if the columns of
   * the dataframes don't match up.
   */
  public union(other: DataFrame): DataFrame {
    const rows = [
      ...Object.values(this.data)[0].data.map((_, rowIdx) => this.row(rowIdx)),
      ...Object.values(other.data)[0].data.map((_, rowIdx) => other.row(rowIdx))
    ];
    return new DataFrame(rows);
  }

  /**
   * Sort the dataframe by the specified column.
   */
  public sortBy(column: string | Series<any>, sortProps?: SortProps): DataFrame {
    const self = (coalesce(sortProps?.inplace, false)) ? this : this.copy();
    column = self.resolveColumn(column);
    const moveMap = mas.getMoveMap(
      column.data,
      {sortProp: undefined, sortOrder: coalesce(sortProps?.sortOrder, 'asc')});
    Object.values(self.data).forEach(s => s.data = mas.sortArrayBasedOnMoveMap(s.data, moveMap.moveMap));
    column.data = moveMap.sortedMasterArray;
    return self;
  }

  /**
   * Partition on the specified series or series name. This will construct groups of dataframes
   * of only the rows where the series contains the same value and subsequently invoke the
   * processor function for each group. The column on which the partition is performed must be
   * sortable.
   */
  public groupBy(
    column_: string | string[] | Series<any>,
    inplaceSort: boolean = false,
  ): DataFramePartition<any> {
    if (Array.isArray(column_)) {
      // Vectorize the values from multiple columns to a single series.
      const emptyArraySeries = new Series(this.mapIndices(_ => []));
      const groupKeySeries = column_.map(this.resolveColumn.bind(this)).reduce((s, n) => s.zip(n, (a, b) => [...a, b]), emptyArraySeries);

      // Make sure the series is sortable for the aggregation.
      // TODO (@nrosenstein): Make this more resilient 👀
      const groupKeySortable = groupKeySeries.map(k => k.join(';'));

      // A mapping to resolve the sortable group key back to it's original vectorized group key.
      const groupKeyMapping = new Map(groupKeySortable.zip(groupKeySeries, (a, b) => [a, b]));

      // Post aggregation function to decompose the previously assembled group key series.
      const decomposeGroupKey = (df: DataFrame): DataFrame => {
        // Make sure to insert columns at the front in same order.
        const groupKeyCol = df.column('_groupKey');
        column_.forEach((_, groupKeyIdx) => {
          groupKeyIdx = column_.length - groupKeyIdx - 1;
          df.setColumn(column_[groupKeyIdx], new Series(df.mapIndices(
            rowIdx => groupKeyMapping.get(groupKeyCol.get(rowIdx))![groupKeyIdx])), true);
        });
        return df.drop('_groupKey', true);
      };

      return this.groupBy(groupKeySortable.named('_groupKey'), inplaceSort).withPostAggregationStep(decomposeGroupKey);
    }
    else {
      let column = this.resolveColumn(column_);
      if (!inplaceSort) {
        column = column.copy();
      }
      const self = this.sortBy(column, {inplace: inplaceSort});
      const result = new DataFramePartition<any>(this.columnNames(), column.name);

      let startRowIdx = 0;
      const rowCount = this.size();
      for (let i = 1; i <= rowCount; ++i) {
        if (i == rowCount || column.get(startRowIdx) !== column.get(i)) {
          result.addPartition(column.get(startRowIdx), self.slice(startRowIdx, i));
          startRowIdx = i;
        }
      }

      return result;
    }
  }

  /**
   * Replace a column in the dataframe.
   */
  public replaceColumn(name: string, func: ((s: Series<any>) => Series<any>)): DataFrame {
    this.setColumn(name, func(this.column(name)));
    return this;
  }

  /**
   * Map dataframe rows.
   */
  public map<R>(func: MapFunction<R, Row>): R[] {
    if (this.empty()) {
      return [];
    }
    return Object.values(this.data)[0].data.map((_, i) => func(this.row(i), i));
  }

  /**
   * Map dataframe row indices.
   */
  public mapIndices<R>(func: MapFunction<R, number>): R[] {
    if (this.empty()) {
      return [];
    }
    return Object.values(this.data)[0].data.map((_, i) => func(i, i));
  }

  /**
   * Flatmap dataframe rows.
   */
  public flatMap<R>(func: MapFunction<R, Row>): R[] {
    if (this.empty()) {
      return [];
    }
    return Object.values(this.data)[0].data.flatMap((_, i) => func(this.row(i), i));
  }

  /**
   * Filter the rows in the dataframe.
   */
  public filter(func: MapFunction<boolean, Row>, inplace: boolean = false): DataFrame {
    const self = inplace ? this : this.copy();
    let offset = 0;
    self.forEachIndex(rowIdx => {
      if (!func(self.row(rowIdx - offset), rowIdx)) {
        self.removeRow(rowIdx - offset);
        offset++;
      }
    });
    return self;
  }

  /**
   * Execute a function for each row index.
   */
  public forEachIndex(func: ((i: number, df: DataFrame) => any)): DataFrame {
    if (!this.empty()) {
      Object.values(this.data)[0].forEach((_, i) => func(i, this));
    }
    return this;
  }

  /**
   * Return a string formatting the dataframe as a table.
   */
  public toString(): string {
    if (this.empty() && this.columnNames().length === 0) {
      return "(Empty dataframe)";
    }

    // Convert all series to strings, replacing `undefined` with "?".
    const series = Object.values(this.data).map(s => s.map(x => '' + (x === undefined ? '?' : x)).named(s.name));

    // Get the widths of each column.
    const widths = series.map(s => Math.max(
      s.name!.length,
      s.max((a, b) => a.length - b.length)?.length || 0
    ));

    // Construct the output string.
    const parts: string[] = [];
    series.forEach((s, i) => parts.push(s.name!.padEnd(widths[i]) + ' '));
    parts[parts.length - 1] = parts[parts.length - 1].trim();
    parts.push('\n');
    series.forEach((_, i) => parts.push('-'.repeat(widths[i]) + ' '));
    parts[parts.length - 1] = parts[parts.length - 1].trim();
    parts.push('\n');

    for (let rowIdx = 0; rowIdx < series[0].size(); ++rowIdx) {
      series.forEach((s, i) => parts.push(s.get(rowIdx).padEnd(widths[i]) + ' '));
      parts[parts.length - 1] = parts[parts.length - 1].trim();
      parts.push('\n');
    }

    return parts.join('');
  }

}

/**
 * Represents a partition of dataframes.
 */
export class DataFramePartition<T> {
  public partitions: {key: T, df: DataFrame}[] = [];
  private postAggregationStep?: (df: DataFrame) => DataFrame;

  public constructor(private originalColumnNames: string[], private name?: string) { }

  /** @internal */
  public addPartition(key: T, partition: DataFrame): void {
    this.partitions.push({key: key, df: partition});
  }

  /** @internal */
  public withPostAggregationStep(f: (df: DataFrame) => DataFrame): DataFramePartition<T> {
    this.postAggregationStep = f;
    return this;
  }

  public agg(processGroup: ((df: DataFrame) => DataFrame | SeriesOrValueMap)): DataFrame {
    const toDF = (currentValue: any, data: DataFrame | SeriesOrValueMap) => {
      if (data instanceof DataFrame) {
        data.setColumn(this.name || '_key', new Series<any>(repeat(currentValue, data.size())));
        return data;
      }
      let count: number | undefined = undefined;
      const entries = Object.entries(data).map(entry => {
        if (!(entry[1] instanceof Series)) {
          entry[1] = new Series<any>([entry[1]]);
        }
        if (count === undefined) {
          count = entry[1].size();
        }
        return entry;
      });
      entries.splice(0, 0, [this.name || '_key', new Series<any>(repeat(currentValue, coalesce(count, 1)))]);
      return new DataFrame(Object.fromEntries(entries));
    };
    const proxyValue = '------$@$@MySuperSecreyProxyValueThisIsADirtyHack';
    if (this.partitions.length === 0) {
      this.addPartition(proxyValue as unknown as T, new DataFrame([], this.originalColumnNames));
    }
    let resultDf = this.partitions.map(item => toDF(item.key, processGroup(item.df)))
      .reduce((agg, df) => agg.union(df))
      .filter(r => r[this.name || '_key'] !== proxyValue);
    if (this.postAggregationStep) {
      resultDf = this.postAggregationStep(resultDf);
    }
    return resultDf;
  }

}
