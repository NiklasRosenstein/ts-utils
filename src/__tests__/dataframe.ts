
import { DataFrame } from "../dataframe"

test("DataFrame.size() if empty", () => {
  expect(new DataFrame().size()).toBe(0);
})

test("DataFrame.toString() if empty", () => {
  expect(new DataFrame().toString()).toBe("(Empty dataframe)");
})

test("DataFrame.map() if empty", () => {
  expect(new DataFrame().map(t => t)).toStrictEqual([]);
})

test("DataFrame.flatMap() if empty", () => {
  expect(new DataFrame().flatMap(t => [])).toStrictEqual([]);
})

test("create dataframe", () => {
  const df = new DataFrame([
    [4, 5, "bar"],
    {a: 1, b: 2, c: "spam"},
    {b: 7, c: "eggs", d: 42}
  ]);

  expect(df.columnNames()).toStrictEqual(["a", "b", "c", "d"]);

  expect(df.column("a").size()).toBe(3);
  expect(df.column("b").size()).toBe(3);
  expect(df.column("c").size()).toBe(3);
  expect(df.column("d").size()).toBe(3);

  expect(df.column("a").sum()).toBe(5);
  expect(df.column("b").sum()).toBe(14);
  expect(df.column("d").sum()).toBe(42);
  expect(df.column("a").cumulativeSum().toArray()).toStrictEqual([4, 5, 5]);
  expect(df.column("b").cumulativeSum().toArray()).toStrictEqual([5, 7, 14]);

  expect(df.row(0)).toStrictEqual({a: 4, b: 5, c: "bar", d: undefined});
  expect(df.row(1)).toStrictEqual({a: 1, b: 2, c: "spam", d: undefined});
  expect(df.row(2)).toStrictEqual({a: undefined, b: 7, c: "eggs", d: 42});

  expect(df.toString()).toBe(
    "a b c    d\n" +
    "- - ---- --\n" +
    "4 5 bar  ?\n" +
    "1 2 spam ?\n" +
    "? 7 eggs 42\n"
  );

  const sortedDf = df.sortBy('c');
  expect(sortedDf.toString()).toBe(
    "a b c    d\n" +
    "- - ---- --\n" +
    "4 5 bar  ?\n" +
    "? 7 eggs 42\n" +
    "1 2 spam ?\n"
  );
  expect(df.toString() == sortedDf.toString()).toBe(false);

  const aggDf = df.groupBy('d').agg(df => ({
    sum: df.column("a").sum(),
    max: df.column("c").max((a, b) => a.length - b.length),
  }));

  expect(aggDf.toString()).toBe(
    "d  sum max\n" +
    "-- --- ----\n" +
    "42 0   eggs\n" +
    "?  5   spam\n"
  );

  aggDf.removeRow(-1);

  expect(aggDf.toString()).toBe(
    "d  sum max\n" +
    "-- --- ----\n" +
    "42 0   eggs\n"
  );

  const filteredDf = df.filter(row => row['d'] !== undefined);
  expect(filteredDf.toString()).toBe(
    "a b c    d\n" +
    "- - ---- --\n" +
    "? 7 eggs 42\n"
  );
})

test("readme example", () => {
  let df = new DataFrame([[1, 2, 3], [1, 5, 6], [2, 8, 9]], ["col1", "col2", "col3"]);
  expect(df.column("col1").median()).toBe(1);
  expect(df.column("col1").mean()).toBe(4/3);
  expect(df.column("col2").sum()).toBe(15);

  let agg = df.groupBy("col1").agg(df => ({
    sum: df.column("col2").sum()
  }))
  expect(agg.column("sum").toArray()).toStrictEqual([7, 8]);
})

test("DataFrame.groupBy() on multiple columns", () => {
  let df = new DataFrame([
    { time: 0, group: 'a', value: 10 },
    { time: 0, group: 'b', value: 20 },
    { time: 0, group: 'b', value: 20 },
    { time: 1, group: 'a', value: 15 },
    { time: 1, group: 'b', value: 20 },
    { time: 1, group: 'c', value: -10 },
  ]);

  const aggDfSum = df.groupBy(['time', 'group']).agg(df => ({ value: df.column('value').sum() }));
  expect(aggDfSum.toString()).toBe(
    "time group value\n" +
    "---- ----- -----\n" +
    "0    a     10\n" +
    "0    b     40\n" +
    "1    a     15\n" +
    "1    b     20\n" +
    "1    c     -10\n"
  );

  const aggDfCumsum = df.groupBy(['time', 'group']).agg(df => ({ value: df.column('value').cumulativeSum() }));
  expect(aggDfCumsum.toString()).toBe(
    "time group value\n" +
    "---- ----- -----\n" +
    "0    a     10\n" +
    "0    b     20\n" +
    "0    b     40\n" +
    "1    a     15\n" +
    "1    b     20\n" +
    "1    c     -10\n"
  );
});

test("DataFrame.groupBy() on empty dataframe", () => {
  const df1 = new DataFrame([], ['a', 'b', 'c', 'd']);
  expect(df1.size()).toBe(0);
  expect(df1.columnNames()).toStrictEqual(['a', 'b', 'c', 'd']);
  const df1Agg = df1.groupBy(['a', 'b']).agg(df => ({ c: df.column('c').sum() }));
  expect(df1Agg.size()).toBe(0);
  expect(df1Agg.columnNames()).toStrictEqual(['a', 'b', 'c']);
  expect(df1Agg.toString()).toBe(
    "a b c\n" +
    "- - -\n"
  );
});
