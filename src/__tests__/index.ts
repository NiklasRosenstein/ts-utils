
import { DataFrame } from "../dataframe"

test('create dataframe', () => {
  const df = new DataFrame([
    [4, 5, "bar"],
    {a: 1, b: 2, c: "spam"},
    {b: 7, c: "eggs", d: 42}
  ]);

  expect(df.columnNames()).toStrictEqual(["a", "b", "c", "d"]);

  expect(df.col("a").size()).toBe(3);
  expect(df.col("b").size()).toBe(3);
  expect(df.col("c").size()).toBe(3);
  expect(df.col("d").size()).toBe(3);

  expect(df.col("a").sum()).toBe(5);
  expect(df.col("b").sum()).toBe(14);
  expect(df.col("d").sum()).toBe(42);

  expect(df.row(0)).toStrictEqual({a: 4, b: 5, c: "bar", d: undefined});
  expect(df.row(1)).toStrictEqual({a: 1, b: 2, c: "spam", d: undefined});
  expect(df.row(2)).toStrictEqual({a: undefined, b: 7, c: "eggs", d: 42});
})
