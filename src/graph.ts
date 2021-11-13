
interface _Entry<K, V> {
  node: V,
  inkeys: Set<K>,
  outkeys: Set<K>,
};

interface _DotvizOptions<K, V> {
  title?: string,
  keytostring?: (key: K) => string,
  label?: (node: V, key: K) => string,
};

/**
 * Represents a directed graph where each node of type *V* is identified by a unique ID *K*.
 * Edges are represented internally as a dictionary mapping from one node ID to a set of other
 * node IDs.
 *
 * @note Batch graph modifications that error can leave the modification in a state where the
 *       modifications where partially applied.
 */
export class DiGraph<K, V = void> {
  private _nodes: Map<K, _Entry<K, V>>;

  /**
   * Create an empty graph.
   */
  public constructor();

  /**
   * Create a new graph constructed from the given set of nodes. A function to extract the key of each
   * node must be specified. Optionally, a function to retrieve the *inputs* of each node can be
   * specified to populate the edges of the graph in the constructor.
   */
  public constructor(nodes: readonly V[], key: ((n: V) => K), inputs?: ((n: V) => K[]));

  public constructor(nodes?: readonly V[], key?: ((n: V) => K), inputs?: ((n: V) => K[])) {
    this._nodes = new Map();
    if (nodes !== undefined) {
      nodes.forEach(node => this.addNode(key!(node), node));
      if (inputs !== undefined) {
        this._nodes.forEach((entry, k) => this.addEdges(inputs!(entry.node), k));
      }
    }
  }

  /**
   * Add a node to the graph. Throws an error if the node already exists.
   */
  public addNode(key: K, node: V): void {
    this.checkNotHasNode(key);
    this._nodes.set(key, {node: node, inkeys: new Set(), outkeys: new Set()});
  }

  /**
   * Returns if the node with the *key* exists in the graph.
   */
  public hasNode(key: K): boolean { return this._nodes.has(key); }

  /**
   * Retrieve a node from the graph. Throws an error if the node does not exist.
   */
  public node(key: K): V;

  /**
   * Retrieve a node from the graph. Returns `null` if the node does not exist.
   */
  public node(key: K, orNull: true): V | null;

  public node(key: K, orNull: boolean = false) {
    return orNull ? this._nodes.get(key)?.node || null :  this.checkHasNode(key).node;
  }

  /**
   * Returns all nodes in the graph.
   */
  public nodes(): Map<K, V> {
    return new Map([...this._nodes.entries()].map(e => [e[0], e[1].node]));
  }

  /**
   * Return the number of nodes in the graph.
   */
  public numNodes(): number {
    return this._nodes.size;
  }

  /**
   * Remove a node from the graph. All edges connecting to the node will be removed.
   */
  public removeNode(key: K): void {
    const entry = this.checkHasNode(key);
    entry.outkeys.forEach(outkey => this.checkHasNode(outkey).inkeys.delete(key));
    entry.inkeys.forEach(inkey => this.checkHasNode(inkey).outkeys.delete(key));
    this._nodes.delete(key);
  }

  /**
   * Add directed edges from one node identified by *key* to the other nodes in *outputs*.
   */
  public addEdges(key: K, outputs: K[]): void;

  /**
   * Add directed edges from the nodes in *inputs* to the node identified by *key*.
   */
  public addEdges(inputs: K[], key: K): void;

  public addEdges(arg1: K | K[], arg2: K[] | K): void {
    if (Array.isArray(arg1)) this._addEdges1(arg1 as K[], arg2 as K);
    else this._addEdges2(arg1 as K, arg2 as K[]);
  }

  /**
   * Checks if the directed edge (key1, key2) exists.
   */
  public hasEdge(key1: K, key2: K): boolean {
    return this.checkHasNode(key2).inkeys.has(key1);
  }

  /**
   * Returns a list of all edges in the graph ordered as (inkey, key).
   */
  public edges(): [K, K][] {
    return [...this._nodes.entries()].flatMap(e => [...e[1].inkeys.values()].map(inkey => [inkey, e[0]] as [K, K]));
  }

  /**
   * Removes one or more directed edges in the order (inputs, key) from the graph.
   */
  public removeEdges(inputs: K[], key: K): void;

  /**
   * Removes one or more directed edges in the order (key, outputs) from the graph.
   */
  public removeEdges(key: K, outputs: K[]): void;

  public removeEdges(arg1: K[] | K, arg2: K | K[]): void {
    if (Array.isArray(arg1)) this._removeEdges1(arg1 as K[], arg2 as K);
    else this._removeEdges2(arg1 as K, arg2 as K[]);
  }

  /**
   * Returns the nodes of the in the graph that have no inputs.
   */
  public roots(): Map<K, V> {
    const result = new Map();
    this._nodes.forEach((entry, key) => {
      if (entry.inkeys.size === 0) {
        result.set(key, entry.node);
      }
    });
    return result;
  }

  /**
   * Returns the nodes of the in the graph that have no outputs.
   */
  public leafs(): Map<K, V> {
    const result = new Map();
    this._nodes.forEach((entry, key) => {
      if (entry.outkeys.size === 0) {
        result.set(key, entry.node);
      }
    });
    return result;
  }

  /**
   * Produce a simple Dotviz representation of the graph.
   */
  public dotviz(options: _DotvizOptions<K, V> = {}): string {
    const parts: string[] = ['digraph'];
    if (options.title !== undefined) parts.push(' ' + options.title);
    parts.push(' {\n');
    const keytostring = options.keytostring ? options.keytostring : (k: K) => '' + k;
    this._nodes.forEach((entry, key) => {
      parts.push('  "' + keytostring(key) + '";\n');
      entry.inkeys.forEach(inkey => {
        parts.push('  "' + keytostring(inkey) + '" -> "' + keytostring(key) + '";\n');
      });
    });
    parts.push('}\n');
    return parts.join('');
  }

  private checkHasNode(key: K): _Entry<K, V> {
    const entry = this._nodes.get(key);
    if (entry === undefined) {
      throw new Error("key \"" + key + "\" does not exist in the graph");
    }
    return entry;
  }

  private checkNotHasNode(key: K): void {
    if (this._nodes.has(key)) {
      throw new Error("key \"" + key + "\" already exists in the graph");
    }
  }

  private _addEdges1(inputs: K[], key: K): void {
    const entry = this.checkHasNode(key);
    inputs.forEach(inkey => {
      this.checkHasNode(inkey).outkeys.add(key);
      entry.inkeys.add(inkey);
    });
  }

  private _addEdges2(key: K, outputs: K[]): void {
    const entry = this.checkHasNode(key);
    outputs.forEach(outkey => {
      this.checkHasNode(outkey).inkeys.add(key);
      entry.outkeys.add(outkey);
    });
  }

  private _removeEdges1(inputs: K[], key: K): void {
    const entry = this.checkHasNode(key);
    inputs.forEach(inkey => {
      this.checkHasNode(inkey).outkeys.delete(key);
      entry.inkeys.delete(inkey);
    });
  }

  private _removeEdges2(key: K, outputs: K[]): void {
    const entry = this.checkHasNode(key);
    outputs.forEach(outkey => {
      this.checkHasNode(outkey).inkeys.delete(key);
      entry.outkeys.delete(outkey);
    })
  }
}
