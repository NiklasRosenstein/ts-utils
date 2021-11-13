
import { DiGraph } from "../graph";

const diamond = [
  {k: "a", i: []},
  {k: "b", i: ["a"]},
  {k: "c", i: ["a"]},
  {k: "d", i: ["b", "c"]},
];

test('graph', () => {
  const graph = new DiGraph(diamond, n => n.k, n => n.i);
  expect(new Set(graph.edges())).toStrictEqual(new Set([["a", "b"], ["a", "c"], ["c", "d"], ["b", "d"]]));
  expect([...graph.roots().keys()]).toStrictEqual(["a"]);
  expect([...graph.leafs().keys()]).toStrictEqual(["d"]);

  graph.removeEdge("c", "d");
  expect(new Set(graph.edges())).toStrictEqual(new Set([["a", "b"], ["a", "c"], ["b", "d"]]));
  expect([...graph.roots().keys()]).toStrictEqual(["a"]);
  expect([...graph.leafs().keys()]).toStrictEqual(["c", "d"]);
});
