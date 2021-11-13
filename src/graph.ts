
interface _Entry<K, V, EV> {
  node: V,
  inkeys: Map<K, EV>,
  outkeys: Map<K, EV>,
};

interface _DotvizOptions<K, V, EV> {
  title?: string,
  keytostring?: (key: K) => string,
  nodelabel?: (node: V, key: K) => string,
  edgelabel?: (e: EV, node1: V, key1: K, node2: V, key2: V) => string,
};

/**
 * Represents a directed graph where each node of type *V* is identified by a unique ID *K*.
 * Edges are represented internally as a dictionary mapping from one node ID to a set of other
 * node IDs.
 *
 * @note Batch graph modifications that error can leave the modification in a state where the
 *       modifications where partially applied.
 */
export class DiGraph<K, V = void, EV = void> {
  private _nodes: Map<K, _Entry<K, V, EV>>;

  /**
   * Create an empty graph.
   */
  public constructor();

  /**
   * Create a new graph constructed from the given set of nodes. A function to extract the key of each
   * node must be specified. Optionally, a function to retrieve the *inputs* of each node can be
   * specified to populate the edges of the graph in the constructor.
   */
  public constructor(nodes: readonly V[], key: ((n: V) => K), inputs?: ((n: V) => [K, EV][]));

  public constructor(nodes?: readonly V[], key?: ((n: V) => K), inputs?: ((n: V) => [K, EV][])) {
    this._nodes = new Map();
    if (nodes !== undefined) {
      nodes.forEach(node => this.addNode(key!(node), node));
      if (inputs !== undefined) {
        this._nodes.forEach((entry, k) => inputs!(entry.node).map(([inkey, edge]) => this.addEdge(inkey, k, edge)));
      }
    }
  }

  /**
   * Returns true if the graph is empty (has no nodes).
   */
  public empty(): boolean {
    return this._nodes.size === 0;
  }

  /**
   * Add a node to the graph. If the node already exists, the value of the node is overwritten but
   * its edges are retained.
   */
  public addNode(key: K, node: V): void {
    const entry = this._nodes.get(key);
    this._nodes.set(key, {
      node: node,
      inkeys: entry?.inkeys || new Map(),
      outkeys: entry?.outkeys || new Map(),
    });
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
    return orNull ? this._nodes.get(key)?.node || null : this.checkHasNode(key).node;
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
   * Remove a node from the graph. All edges connecting to the node will be removed. This is
   * a no-op if the node does not exist in the graph.
   */
  public removeNode(key: K): void {
    const entry = this._nodes.get(key);
    if (entry !== undefined) {
      entry.outkeys.forEach((_, outkey) => this.checkHasNode(outkey).inkeys.delete(key));
      entry.inkeys.forEach((_, inkey) => this.checkHasNode(inkey).outkeys.delete(key));
      this._nodes.delete(key);
    }
  }

  /**
   * Add directed edge from node *key1* to node *key2*, saving the given value for *edge* along with it.
   * If the edge already exists, it will be overwritten.
   */
  public addEdge(key1: K, key2: K, value: EV): void {
    const node1 = this.checkHasNode(key1);
    const node2 = this.checkHasNode(key2);
    node1.outkeys.set(key2, value);
    node2.inkeys.set(key1, value);
  }

  /**
   * Checks if the directed edge (key1, key2) exists.
   */
  public hasEdge(key1: K, key2: K): boolean {
    return this.checkHasNode(key2).inkeys.has(key1);
  }

  /**
   * Read the value of an edge. Throws an error if the edge does not exist.
   */
  public edge(key1: K, key2: K): EV;

  /**
   * Read the value of an edge, or return null if it doesn't exist.
   */
  public edge(key1: K, key2: K, orNull: true): EV | null;

  public edge(key1: K, key2: K, orNull: boolean = false): EV | null {
    if (orNull) {
      const node = this._nodes.get(key2);
      if (node !== undefined) {
        return node.inkeys.get(key1) || null;
      }
      return null;
    }
    else {
      const result = this.checkHasNode(key2).inkeys.get(key1);
      if (result === undefined) {
        throw new Error('edge "' + key1 + '" -> "' + key2 + '"');
      }
      return result;
    }
  }

  /**
   * Returns a list of all edges in the graph ordered as (inkey, key).
   */
  public edges(): [K, K][] {
    return [...this._nodes.entries()].flatMap(e => [...e[1].inkeys.keys()].map(inkey => [inkey, e[0]] as [K, K]));
  }

  /**
   * Removes a directed edge from *key1* to *key2*. This is a no-op if the edge does not exist.
   */
  public removeEdge(key1: K, key2: K): void {
    const node1 = this.checkHasNode(key1);
    const node2 = this.checkHasNode(key2);
    node1.outkeys.delete(key2);
    node2.inkeys.delete(key1);
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
   * Get the input edges for a node.
   */
  public inputs(key: K): ReadonlyMap<K, EV> {
    return this.checkHasNode(key).inkeys;
  }

  /**
   * Get the output edges for a node.
   */
  public outputs(key: K): ReadonlyMap<K, EV> {
    return this.checkHasNode(key).outkeys;
  }

  /**
   * Produce a simple Dotviz representation of the graph.
   *
   * TODO: Implement use of edgelabels and nodelabels.
   */
  public dotviz(options: _DotvizOptions<K, V, EV> = {}): string {
    const parts: string[] = ['digraph'];
    if (options.title !== undefined) parts.push(' ' + options.title);
    parts.push(' {\n');
    const keytostring = options.keytostring ? options.keytostring : (k: K) => '' + k;
    this._nodes.forEach((entry, key) => {
      parts.push('  "' + keytostring(key) + '";\n');
      entry.inkeys.forEach((_, inkey) => {
        parts.push('  "' + keytostring(inkey) + '" -> "' + keytostring(key) + '";\n');
      });
    });
    parts.push('}\n');
    return parts.join('');
  }

  private checkHasNode(key: K): _Entry<K, V, EV> {
    const entry = this._nodes.get(key);
    if (entry === undefined) {
      throw new Error("key \"" + key + "\" does not exist in the graph");
    }
    return entry;
  }

}
