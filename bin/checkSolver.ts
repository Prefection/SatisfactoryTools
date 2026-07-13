import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import {ratePerMachine, solveProduction} from '@src/Solver/ProductionSolver';
import {IJsonSchema} from '@src/Schema/IJsonSchema';
import {IProductionDataApiRequest} from '@src/Tools/Production/IProductionData';

const data: IJsonSchema = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'data1.2.json')).toString());

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
		assert.ok(Math.abs(balance) < 1e-4, `${label}: item ${item} unbalanced (${balance})`);
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

// 5. Co-product byproduct: Recipe_Plastic_C makes plastic:2 + heavy-oil-residue:1 per cycle (fixed 2:1),
// so 20 plastic/min forces 10 residue/min out. Block every non-alternate path that could reconsume the
// residue (alternates are excluded by default anyway) so the LP can't quietly route it away instead of
// emitting it, exercising computeNet's excess branch and the Byproduct side of the Sink/Byproduct routing.
const plasticBlockedRecipes = ['Recipe_ResidualPlastic_C', 'Recipe_PetroleumCoke_C', 'Recipe_ResidualFuel_C', 'Recipe_PackagedOilResidue_C', 'Recipe_GunpowderMK2_C'];
const byproduct = request({production: [{item: 'Desc_Plastic_C', type: 'perMinute', amount: 20, ratio: 100}], blockedRecipes: plasticBlockedRecipes});
const byproductResp = await solveProduction(byproduct, data);
assertFeasible(byproduct, byproductResp, 'plastic-byproduct');
assert.ok(Math.abs((byproductResp['Desc_HeavyOilResidue_C#Byproduct'] ?? 0) - 10) < 1e-4, `expected 10 heavy oil residue byproduct, got ${JSON.stringify(byproductResp)}`);
assert.ok(!('Desc_HeavyOilResidue_C#Sink' in byproductResp), 'residue must not be sinked when unsinkable');

// 6. Same request, but the residue is declared sinkable: excess must route to Sink instead of Byproduct,
// proving the Sink-vs-Byproduct routing branch works both ways.
const routed = request({...byproduct, sinkableResources: ['Desc_HeavyOilResidue_C']});
const routedResp = await solveProduction(routed, data);
assertFeasible(routed, routedResp, 'plastic-sink-routing');
assert.ok(Math.abs((routedResp['Desc_HeavyOilResidue_C#Sink'] ?? 0) - 10) < 1e-4, `expected 10 heavy oil residue sink, got ${JSON.stringify(routedResp)}`);
assert.ok(!('Desc_HeavyOilResidue_C#Byproduct' in routedResp), 'residue must not be a byproduct when sinkable');

// --- Maximize: iron ingot capped at 70 ore/min -> 2.333 smelters, 70 ingot (fractional) ---
const maxFrac = await solveProduction(request({
	resourceMax: {...resourceMax, Desc_OreIron_C: 70},
	production: [{item: 'Desc_IronIngot_C', type: 'max', amount: 0, ratio: 100}],
}), data);
assert.ok(Math.abs((maxFrac['Desc_IronIngot_C#Product'] ?? 0) - 70) < 1e-4, `maximize ingot = 70, got ${maxFrac['Desc_IronIngot_C#Product']}`);
assert.ok(Math.abs((maxFrac['Recipe_IngotIron_C@100#Desc_SmelterMk1_C'] ?? 0) - 70 / 30) < 1e-4, 'fractional 2.333 smelters');

// --- Maximize + whole machines: 2 smelters, 60 ingot (10 ore idle) ---
const maxInt = await solveProduction(request({
	integerMachines: true,
	resourceMax: {...resourceMax, Desc_OreIron_C: 70},
	production: [{item: 'Desc_IronIngot_C', type: 'max', amount: 0, ratio: 100}],
}), data);
const intSmelters = maxInt['Recipe_IngotIron_C@100#Desc_SmelterMk1_C'] ?? 0;
assert.strictEqual(intSmelters, Math.round(intSmelters), 'integer smelters are whole');
assert.strictEqual(intSmelters, 2, `2 whole smelters, got ${intSmelters}`);
assert.ok(Math.abs((maxInt['Desc_IronIngot_C#Product'] ?? 0) - 60) < 1e-4, 'whole-machine ingot = 60');

// --- List-order priority: ingot vs iron rod (rod is made from ingot), capped ore ---
// ingot-first starves rod (all ingot output is locked); rod-first leaves rod > 0.
const ingotFirst = await solveProduction(request({
	resourceMax: {...resourceMax, Desc_OreIron_C: 60},
	production: [
		{item: 'Desc_IronIngot_C', type: 'max', amount: 0, ratio: 100},
		{item: 'Desc_IronRod_C', type: 'max', amount: 0, ratio: 100},
	],
}), data);
const rodFirst = await solveProduction(request({
	resourceMax: {...resourceMax, Desc_OreIron_C: 60},
	production: [
		{item: 'Desc_IronRod_C', type: 'max', amount: 0, ratio: 100},
		{item: 'Desc_IronIngot_C', type: 'max', amount: 0, ratio: 100},
	],
}), data);
assert.ok((rodFirst['Desc_IronRod_C#Product'] ?? 0) > 1e-4, 'rod-first yields rod');
assert.ok((ingotFirst['Desc_IronRod_C#Product'] ?? 0) < 1e-4, 'ingot-first starves rod');
// A starved maximize target emits no product node at all (not a 0/min node).
assert.ok(!('Desc_IronRod_C#Product' in ingotFirst), 'starved max target has no zero product entry');

// --- "At least X" floor: ingot-first normally starves rod (pure max); an atLeast row guarantees
// the rod appears at >= the floor while ingot still takes the surplus. ---
const rodFloored = await solveProduction(request({
	resourceMax: {...resourceMax, Desc_OreIron_C: 60},
	production: [
		{item: 'Desc_IronIngot_C', type: 'max', amount: 0, ratio: 100},
		{item: 'Desc_IronRod_C', type: 'atLeast', amount: 10, ratio: 100},
	],
}), data);
assert.ok((rodFloored['Desc_IronRod_C#Product'] ?? 0) >= 10 - 1e-4, `rod floor honored, got ${rodFloored['Desc_IronRod_C#Product']}`);
assert.ok((rodFloored['Desc_IronIngot_C#Product'] ?? 0) > 1e-4, 'ingot still maximized with the surplus');

// Several "at least" rows must not spuriously go infeasible: locking each maximized target at its
// EXACT optimum is a floating-point knife edge the next pass can't satisfy, so the lock is relaxed.
const manyFloors = request({
	resourceMax: {...resourceMax, Desc_OreIron_C: 180, Desc_OreCopper_C: 60, Desc_Coal_C: 120, Desc_Stone_C: 60},
	production: [
		{item: 'Desc_SpaceElevatorPart_1_C', type: 'atLeast', amount: 1, ratio: 100},
		{item: 'Desc_Rotor_C', type: 'atLeast', amount: 1, ratio: 100},
		{item: 'Desc_IronPlateReinforced_C', type: 'atLeast', amount: 1, ratio: 100},
		{item: 'Desc_ModularFrame_C', type: 'atLeast', amount: 1, ratio: 100},
	],
});
const manyResp = await solveProduction(manyFloors, data);
assert.ok(Object.keys(manyResp).length > 0, 'multi "at least" chain stays feasible (no FP-boundary infeasibility)');
for (const it of ['Desc_SpaceElevatorPart_1_C', 'Desc_Rotor_C', 'Desc_IronPlateReinforced_C', 'Desc_ModularFrame_C']) {
	assert.ok((manyResp[`${it}#Product`] ?? 0) >= 1 - 1e-3, `${it} meets its floor`);
}
// Default unchanged: a pure 'max' row with a leftover amount still ignores it (no floor).
const maxIgnoresAmount = await solveProduction(request({
	resourceMax: {...resourceMax, Desc_OreIron_C: 60},
	production: [
		{item: 'Desc_IronIngot_C', type: 'max', amount: 0, ratio: 100},
		{item: 'Desc_IronRod_C', type: 'max', amount: 10, ratio: 100},
	],
}), data);
assert.ok(!('Desc_IronRod_C#Product' in maxIgnoresAmount), 'pure max ignores amount (default behavior unchanged)');

// --- Degenerate MILP: whole machines + tight caps must not add a goal-neutral recipe (Iron Rod -> Iron
// Rebar) just to sink surplus. Among equal-output integer plans the solver must prefer fewer machines. ---
const tight: {[k: string]: number} = {};
for (const r of Object.keys(data.resources)) tight[r] = 0;
tight.Desc_Coal_C = 120; tight.Desc_OreCopper_C = 60; tight.Desc_OreIron_C = 180; tight.Desc_Stone_C = 60;
const noWaste = request({
	integerMachines: true, resourceMax: tight,
	production: [
		{item: 'Desc_ModularFrame_C', type: 'max', amount: 0, ratio: 100},
		{item: 'Desc_Rotor_C', type: 'max', amount: 0, ratio: 100},
		{item: 'Desc_IronPlateReinforced_C', type: 'max', amount: 0, ratio: 100},
		{item: 'Desc_SpaceElevatorPart_1_C', type: 'max', amount: 0, ratio: 100},
	],
});
const noWasteResp = await solveProduction(noWaste, data);
assert.ok(!('Recipe_SpikedRebar_C@100#Desc_ConstructorMk1_C' in noWasteResp), `no pointless Iron Rebar recipe, got ${JSON.stringify(noWasteResp)}`);
assert.ok(!('Desc_SpikedRebar_C#Byproduct' in noWasteResp), 'no Iron Rebar byproduct from surplus');
assert.ok((noWasteResp['Desc_ModularFrame_C#Product'] ?? 0) >= 6 - 1e-4, 'primary target output not eroded by the tie-break penalty');

console.log('OK: solveProduction worked example + feasibility set + co-product byproduct/sink routing pass.');
