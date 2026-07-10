import assert from 'node:assert';
import {DataProvider} from '@src/Data/DataProvider';
import {ProductionResultFactory} from '@src/Tools/Production/Result/ProductionResultFactory';
import {IProductionDataApiRequest, IProductionDataApiResponse} from '@src/Tools/Production/IProductionData';

// Load game data headlessly. This alone proves the JSON-module imports and
// Model.change() run outside a browser / AngularJS.
DataProvider.change('1.0');
const data = DataProvider.get();

assert.ok(Object.keys(data.items).length > 0, 'data.items should be populated');
assert.ok(Object.keys(data.recipes).length > 0, 'data.recipes should be populated');

// Fixed input: one product of the first item in the data set (deterministic —
// data.json is committed and object key order is stable).
const item = Object.keys(data.items)[0];
const amount = 60;

const request: IProductionDataApiRequest = {
	gameVersion: '1.0',
	resourceMax: {},
	resourceWeight: {},
	blockedResources: [],
	blockedRecipes: [],
	allowedAlternateRecipes: [],
	sinkableResources: [],
	production: [], // not read on the response→result path; the response fixture drives the graph
	input: [],
};

// Fixed solver-response fixture (no network call): a single product node.
const response: IProductionDataApiResponse = {
	[`${item}#Product`]: amount,
};

const result = new ProductionResultFactory().create(request, response, data);

// Known, stable output for this fixed input:
assert.strictEqual(result.graph.nodes.length, 1, 'graph should have exactly one node');
assert.strictEqual(result.details.hasOutput, true, 'should report output');
assert.strictEqual(result.details.output[item], amount, 'output amount should match the request');
assert.strictEqual(result.details.buildings.amount, 0, 'a product-only plan needs no buildings');
assert.strictEqual(result.details.power.total.average, 0, 'a product-only plan draws no power');

console.log(`OK: production-result pipeline runs headless (item ${item}, ${result.graph.nodes.length} node).`);
