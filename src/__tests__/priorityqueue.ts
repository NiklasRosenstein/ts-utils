
import { bisect, PriorityQueue } from "../priorityqueue";

test("bisect", () => {
  const arr = [1, 4, 7];
  expect(bisect(arr, 0)).toBe(0);
  expect(bisect(arr, 1)).toBe(1);
  expect(bisect(arr, 3)).toBe(1);
  expect(bisect(arr, 4)).toBe(2);
  expect(bisect(arr, 7)).toBe(3);
  expect(bisect(arr, 8)).toBe(3);
});

test("PriorityQueue", () => {
  const q = new PriorityQueue<string>([{priority: 100, value: "foo"}, {priority: 50, value: "bar"}]);
  expect(q.values()).toStrictEqual(["bar", "foo"]);
  q.add(75, "spam");
  expect(q.values()).toStrictEqual(["bar", "spam", "foo"]);
  q.add(150, "eggs");
  expect(q.values()).toStrictEqual(["bar", "spam", "foo", "eggs"]);
  q.add(0, "ham");
  expect(q.values()).toStrictEqual(["ham", "bar", "spam", "foo", "eggs"]);
});
