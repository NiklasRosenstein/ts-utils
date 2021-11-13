
import { bisect } from "../functions";

test("bisect", () => {
  const arr = [1, 4, 7];
  expect(bisect(arr, 0)).toBe(0);
  expect(bisect(arr, 1)).toBe(1);
  expect(bisect(arr, 3)).toBe(1);
  expect(bisect(arr, 4)).toBe(2);
  expect(bisect(arr, 7)).toBe(3);
  expect(bisect(arr, 8)).toBe(3);
});
