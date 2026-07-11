import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {solve} from 'yalps';
import {buildProductionModel, ratePerMachine, solveProduction} from '@src/Solver/ProductionSolver';
import {IJsonSchema} from '@src/Schema/IJsonSchema';
import {IProductionDataApiRequest} from '@src/Tools/Production/IProductionData';

const data: IJsonSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'data.json')).toString());

// Full default resource caps/weights so every raw resource is extractable (mirrors what the client sends).
const resourceMax: {[k: string]: number} = {};
const resourceWeight: {[k: string]: number} = {};
for (const res of Object.keys(data.resources)) { resourceMax[res] = Number.MAX_SAFE_INTEGER; resourceWeight[res] = 1; }

function request(over: Partial<IProductionDataApiRequest>): IProductionDataApiRequest {
	return {
		production: [], input: [], resourceMax, resourceWeight,
		blockedResources: [], blockedRecipes: [], allowedAlternateRecipes: [], sinkableResources: [],
		gameVersion: '1.0', ...over,
	};
}

// --- ratePerMachine sanity on real data (iron ingot: 1/cycle, 2s, smelter speed 1 = 30/min) ---
assert.strictEqual(ratePerMachine(data.recipes.Recipe_IngotIron_C, 1, data), 30, 'iron ingot rate');

// --- Worked example: 60 iron ingot/min ---
const ironResp = await solveProduction(request({production: [{item: 'Desc_IronIngot_C', type: 'perMinute', amount: 60, ratio: 100}]}), data);
assert.ok(Math.abs((ironResp['Recipe_IngotIron_C@100#Desc_SmelterMk1_C'] ?? 0) - 2) < 1e-6, `2 smelters expected, got ${JSON.stringify(ironResp)}`);
assert.ok(Math.abs((ironResp['Desc_OreIron_C#Mine'] ?? 0) - 60) < 1e-6, '60 ore mined');
assert.ok(Math.abs((ironResp['Desc_IronIngot_C#Product'] ?? 0) - 60) < 1e-6, '60 ingot product');

// --- Feasibility helper: re-derive balances from a response and assert it is valid ---
function assertFeasible(req: IProductionDataApiRequest, resp: {[k: string]: number}, label: string): void {
	const net: {[item: string]: number} = {};
	const add = (item: string, amt: number) => { net[item] = (net[item] ?? 0) + amt; };
	for (const [key, value] of Object.entries(resp)) {
		const [machineData, machineClass] = key.split('#');
		if (machineClass === 'Mine' || machineClass === 'Input') add(machineData, value);
		else if (machineClass === 'Product' || machineClass === 'Byproduct' || machineClass === 'Sink') add(machineData, -value);
		else { // "<recipe>@100#<building>"
			const recipe = data.recipes[machineData.split('@')[0]];
			for (const p of recipe.products) add(p.item, ratePerMachine(recipe, p.amount, data) * value);
			for (const i of recipe.ingredients) add(i.item, -ratePerMachine(recipe, i.amount, data) * value);
			assert.ok(!req.blockedRecipes.includes(recipe.className), `${label}: used blocked recipe ${recipe.className}`);
		}
	}
	for (const [item, balance] of Object.entries(net)) {
		assert.ok(balance > -1e-4, `${label}: item ${item} unbalanced (${balance})`);
	}
	for (const p of req.production) {
		if (p.item && p.type === 'perMinute' && p.amount > 0) {
			assert.ok(Math.abs((resp[`${p.item}#Product`] ?? 0) - p.amount) < 1e-4, `${label}: target ${p.item} not met`);
		}
	}
	for (const [key, value] of Object.entries(resp)) {
		if (key.endsWith('#Mine')) {
			const res = key.slice(0, -'#Mine'.length);
			assert.ok(value <= (req.resourceMax[res] ?? 0) + 1e-4, `${label}: ${res} over cap`);
		}
	}
}

// --- Feasibility set ---
// 1. Multi-step chain: reinforced iron plate (screws + plates from ingots).
const rip = request({production: [{item: 'Desc_IronPlateReinforced_C', type: 'perMinute', amount: 5, ratio: 100}]});
assertFeasible(rip, await solveProduction(rip, data), 'reinforced-iron-plate');

// 2. Resource cap: iron ingot with ore capped at 30/min -> at most 30 ingot; ask for 30.
const capped = request({production: [{item: 'Desc_IronIngot_C', type: 'perMinute', amount: 30, ratio: 100}], resourceMax: {...resourceMax, Desc_OreIron_C: 30}});
assertFeasible(capped, await solveProduction(capped, data), 'ore-capped');

// 3. Blocked recipe: block the standard iron ingot recipe, allow the pure-iron-ingot alternate, expect a solution that avoids the blocked one.
const blocked = request({
	production: [{item: 'Desc_IronIngot_C', type: 'perMinute', amount: 30, ratio: 100}],
	blockedRecipes: ['Recipe_IngotIron_C'],
	allowedAlternateRecipes: ['Recipe_Alternate_PureIronIngot_C'],
});
const blockedResp = await solveProduction(blocked, data);
assertFeasible(blocked, blockedResp, 'blocked-standard-iron');
assert.ok(!('Recipe_IngotIron_C@100#Desc_SmelterMk1_C' in blockedResp), 'blocked recipe must not appear');

// 4. Infeasible: demand an item with no allowed recipe path -> empty response.
const infeasible = request({production: [{item: 'Desc_IronIngot_C', type: 'perMinute', amount: 30, ratio: 100}], blockedRecipes: ['Recipe_IngotIron_C']});
assert.deepStrictEqual(await solveProduction(infeasible, data), {}, 'no path -> empty response');

console.log('OK: solveProduction worked example + feasibility set pass.');
