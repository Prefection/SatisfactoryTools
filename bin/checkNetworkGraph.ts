import assert from 'node:assert';
import {layoutGraph} from '@src/utils/networkLayout';

const nodes = [{id: 1, label: 'A'}, {id: 2, label: 'B'}, {id: 3, label: 'C'}];
const edges = [{from: 1, to: 2}, {from: 2, to: 3}];
const out = await layoutGraph(nodes, edges);
assert.strictEqual(out.length, 3, 'all nodes returned');
assert.ok(out.every((n) => typeof n.x === 'number' && typeof n.y === 'number'), 'every node has x/y after layout');
assert.ok(new Set(out.map((n) => `${n.x},${n.y}`)).size > 1, 'nodes are not all at the same position');
console.log('OK: networkLayout assigns coordinates.');
