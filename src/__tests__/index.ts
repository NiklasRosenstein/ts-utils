
import { DataFrame } from "../dataframe"

test('create dataframe', () => {
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
