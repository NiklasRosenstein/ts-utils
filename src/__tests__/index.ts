
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

  expect(df.row(0)).toStrictEqual({a: 4, b: 5, c: "bar", d: undefined});
  expect(df.row(1)).toStrictEqual({a: 1, b: 2, c: "spam", d: undefined});
  expect(df.row(2)).toStrictEqual({a: undefined, b: 7, c: "eggs", d: 42});

  expect(df.toString()).toBe(
    "a b c    d\n" +
    "- - ---- --\n" +
    "4 5 bar  ?\n" +
    "1 2 spam ?\n" +
    "? 7 eggs 42\n"
  )
})
