
import { DiGraph } from "../graph";

const diamond = [
  {k: "a", i: []},
  {k: "b", i: ["a"]},
  {k: "c", i: ["a"]},
  {k: "d", i: ["b", "c"]},
];

test('graph', () => {
  const graph = new DiGraph(diamond, n => n.k, n => n.i.map(v => [v, undefined]) as [string, any][]);
  expect(new Set(graph.edges())).toStrictEqual(new Set([["a", "b"], ["a", "c"], ["c", "d"], ["b", "d"]]));
  expect([...graph.roots().keys()]).toStrictEqual(["a"]);
  expect([...graph.leafs().keys()]).toStrictEqual(["d"]);

  // Overwrite values of existing edges.
  graph.addEdge("a", "b", "ab-edge");
  graph.addEdge("b", "d", "bd-edge");

  console.log(graph['_nodes']);
  console.log(graph.inputs("b"));
  console.log(graph.outputs("b"));

  expect(graph.edge("a", "b") == 42);
  expect(new Set(graph.inputs("d").keys())).toStrictEqual(new Set(["b", "c"]));
  expect(new Set(graph.inputs("a").values())).toStrictEqual(new Set([]));
  expect(new Set(graph.outputs("a").values())).toStrictEqual(new Set(["ab-edge", undefined]));
  expect(new Set(graph.inputs("b").values())).toStrictEqual(new Set(["ab-edge"]));
  expect(new Set(graph.outputs("b").values())).toStrictEqual(new Set(["bd-edge"]));
  expect(new Set(graph.inputs("d").values())).toStrictEqual(new Set(["bd-edge", undefined]));

  graph.removeEdge("c", "d");
  expect(new Set(graph.edges())).toStrictEqual(new Set([["a", "b"], ["a", "c"], ["b", "d"]]));
  expect([...graph.roots().keys()]).toStrictEqual(["a"]);
  expect([...graph.leafs().keys()]).toStrictEqual(["c", "d"]);

});
