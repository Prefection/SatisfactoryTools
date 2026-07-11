import assert from 'node:assert';
import {solve} from 'yalps';
import {buildProductionModel, ratePerMachine} from '@src/Solver/ProductionSolver';

// Minimal fake dataset: OreX resource → IngotX (1/cycle, 2s, speed 1) → PlateX (1/cycle, 4s, speed 1).
const data: any = {
	buildings: {B_Smelter: {metadata: {manufacturingSpeed: 1}}, B_Constructor: {metadata: {manufacturingSpeed: 1}}},
	resources: {Desc_OreX: {}},
	recipes: {
		R_Ingot: {className: 'R_Ingot', alternate: false, inMachine: true, time: 2, producedIn: ['B_Smelter'],
			ingredients: [{item: 'Desc_OreX', amount: 1}], products: [{item: 'Desc_IngotX', amount: 1}]},
		R_Plate: {className: 'R_Plate', alternate: false, inMachine: true, time: 4, producedIn: ['B_Constructor'],
			ingredients: [{item: 'Desc_IngotX', amount: 3}], products: [{item: 'Desc_PlateX', amount: 2}]},
	},
};

// rate: ingot = 1 * 1 * 60/2 = 30/min/machine; plate out = 2 * 60/4 = 30/min/machine, ingot in = 3 * 60/4 = 45/min/machine.
assert.strictEqual(ratePerMachine(data.recipes.R_Ingot, 1, data), 30, 'ingot rate');
assert.strictEqual(ratePerMachine(data.recipes.R_Plate, 2, data), 30, 'plate out rate');
assert.strictEqual(ratePerMachine(data.recipes.R_Plate, 3, data), 45, 'ingot consumption rate');

const request: any = {
	production: [{item: 'Desc_PlateX', type: 'perMinute', amount: 30, ratio: 100}],
	input: [], resourceMax: {Desc_OreX: 1000}, resourceWeight: {Desc_OreX: 1},
	blockedResources: [], blockedRecipes: [], allowedAlternateRecipes: [], sinkableResources: [], gameVersion: '1.0',
};

const sol = solve(buildProductionModel(request, data));
assert.strictEqual(sol.status, 'optimal', 'solvable');
const v = new Map(sol.variables);
// 30 plate/min needs 1 plate machine (30/min) → 45 ingot/min → 1.5 ingot machines → 45 ore/min → 45 ore extraction.
assert.ok(Math.abs((v.get('recipe:R_Plate') ?? 0) - 1) < 1e-6, `plate machines: ${v.get('recipe:R_Plate')}`);
assert.ok(Math.abs((v.get('recipe:R_Ingot') ?? 0) - 1.5) < 1e-6, `ingot machines: ${v.get('recipe:R_Ingot')}`);
assert.ok(Math.abs((v.get('mine:Desc_OreX') ?? 0) - 45) < 1e-6, `ore mined: ${v.get('mine:Desc_OreX')}`);

console.log('OK: buildProductionModel produces a correct, solvable LP.');
