# @nrosenstein/ts-utils

Various things implemented in TypeScript.

## Development

* `npm run test` to run unit tests
* `npm run publish` to publish to NPM

## Contents

---

### `@nrosenstein/ts-utils/dataframe`

A `DataFrame` class inspired by Pandas, with minimal features.

__Quickstart__

```ts
import { DataFrame } from "@nrosenstein/ts-utils/dataframe";

let df = new DataFrame([[1, 2, 3], [1, 5, 6], [2, 8, 9]], ["col1", "col2", "col3"]);
expect(df.column("col2").sum()).toBe(15);

let agg = df.groupBy("col1").agg(df => ({
  sum: df.column("col2").sum()
}))
expect(agg.column("sum").toArray()).toStrictEqual([7, 8]);
```
