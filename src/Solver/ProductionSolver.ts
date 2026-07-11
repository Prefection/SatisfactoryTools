import {solve, type Model, type Solution} from 'yalps';
import {IJsonSchema} from '@src/Schema/IJsonSchema';
import {IRecipeSchema} from '@src/Schema/IRecipeSchema';
import {IProductionDataApiRequest, IProductionDataApiResponse} from '@src/Tools/Production/IProductionData';

// ponytail: 'perMinute' mirrors Constants.PRODUCTION_TYPE.PER_MINUTE (frozen game constant); inline to avoid the import.
const PER_MINUTE = 'perMinute';
const EPS = 1e-7;

export function ratePerMachine(recipe: IRecipeSchema, perCycleAmount: number, data: IJsonSchema): number {
	const building = data.buildings[recipe.producedIn[0]];
	const manufacturingSpeed = building?.metadata?.manufacturingSpeed ?? 1;
	return perCycleAmount * manufacturingSpeed * (60 / recipe.time);
}

function isAllowedRecipe(recipe: IRecipeSchema, request: IProductionDataApiRequest): boolean {
	if (request.blockedRecipes.includes(recipe.className)) return false;
	if (!recipe.inMachine || recipe.producedIn.length === 0) return false;
	return recipe.alternate ? request.allowedAlternateRecipes.includes(recipe.className) : true;
}

export function buildProductionModel(request: IProductionDataApiRequest, data: IJsonSchema): Model {
	const variables: {[name: string]: {[coef: string]: number}} = {};
	const constraints: {[name: string]: {min?: number; max?: number}} = {};
	const items = new Set<string>();

	// Fixed per-minute demand per target item.
	const demand: {[item: string]: number} = {};
	for (const p of request.production) {
		if (p.item && p.type === PER_MINUTE && p.amount > 0) {
			demand[p.item] = (demand[p.item] ?? 0) + p.amount;
			items.add(p.item);
		}
	}

	// One variable per allowed recipe: net items/min per machine into each item balance.
	for (const recipe of Object.values(data.recipes)) {
		if (!isAllowedRecipe(recipe, request)) continue;
		const coefs: {[coef: string]: number} = {};
		for (const product of recipe.products) {
			coefs['item:' + product.item] = (coefs['item:' + product.item] ?? 0) + ratePerMachine(recipe, product.amount, data);
			items.add(product.item);
		}
		for (const ingredient of recipe.ingredients) {
			coefs['item:' + ingredient.item] = (coefs['item:' + ingredient.item] ?? 0) - ratePerMachine(recipe, ingredient.amount, data);
			items.add(ingredient.item);
		}
		variables['recipe:' + recipe.className] = coefs;
	}

	// One extraction variable per non-blocked raw resource, capped and cost-weighted.
	for (const res of Object.keys(data.resources)) {
		if (request.blockedResources.includes(res)) continue;
		variables['mine:' + res] = {['item:' + res]: 1, ['cap:' + res]: 1, cost: request.resourceWeight[res] ?? 0};
		constraints['cap:' + res] = {max: request.resourceMax[res] ?? 0};
		items.add(res);
	}

	// One free (capped) supply variable per provided input.
	for (const input of request.input) {
		if (input.item && input.amount > 0) {
			variables['input:' + input.item] = {['item:' + input.item]: 1, ['incap:' + input.item]: 1};
			constraints['incap:' + input.item] = {max: input.amount};
			items.add(input.item);
		}
	}

	// Balance constraint per referenced item: production - consumption >= demand (free disposal above demand).
	for (const item of items) {
		constraints['item:' + item] = {min: demand[item] ?? 0};
	}

	return {direction: 'minimize', objective: 'cost', constraints, variables};
}

// production - consumption per item, recomputed from the solved variable values.
function computeNet(solution: Solution, data: IJsonSchema): {[item: string]: number} {
	const net: {[item: string]: number} = {};
	const add = (item: string, amount: number) => { net[item] = (net[item] ?? 0) + amount; };
	for (const [name, value] of solution.variables) {
		if (value <= EPS) continue;
		if (name.startsWith('recipe:')) {
			const recipe = data.recipes[name.slice(7)];
			for (const p of recipe.products) add(p.item, ratePerMachine(recipe, p.amount, data) * value);
			for (const i of recipe.ingredients) add(i.item, -ratePerMachine(recipe, i.amount, data) * value);
		} else if (name.startsWith('mine:')) {
			add(name.slice(5), value);
		} else if (name.startsWith('input:')) {
			add(name.slice(6), value);
		}
	}
	return net;
}

export async function solveProduction(request: IProductionDataApiRequest, data: IJsonSchema): Promise<IProductionDataApiResponse> {
	const solution = solve(buildProductionModel(request, data));
	const response: IProductionDataApiResponse = {};
	if (solution.status !== 'optimal') return response; // infeasible/unbounded -> empty, like the old remote catch

	for (const [name, value] of solution.variables) {
		if (value <= EPS) continue;
		if (name.startsWith('recipe:')) {
			const cls = name.slice(7);
			response[`${cls}@100#${data.recipes[cls].producedIn[0]}`] = value;
		} else if (name.startsWith('mine:')) {
			response[`${name.slice(5)}#Mine`] = value;
		} else if (name.startsWith('input:')) {
			response[`${name.slice(6)}#Input`] = value;
		}
	}

	// Aggregate demand per item (mirrors buildProductionModel's demand map) so duplicate target
	// rows for the same item report their summed amount instead of the last row overwriting the rest.
	const targetDemand: {[item: string]: number} = {};
	for (const p of request.production) {
		if (p.item && p.type === PER_MINUTE && p.amount > 0) {
			targetDemand[p.item] = (targetDemand[p.item] ?? 0) + p.amount;
		}
	}
	const targets = new Set(Object.keys(targetDemand));
	for (const [item, amount] of Object.entries(targetDemand)) {
		response[`${item}#Product`] = amount;
	}

	// ponytail: free-disposal excess -> Sink if sinkable else Byproduct. Refine only if a live spot-check diverges.
	const net = computeNet(solution, data);
	for (const [item, amount] of Object.entries(net)) {
		if (targets.has(item) || amount <= EPS) continue;
		response[`${item}#${request.sinkableResources.includes(item) ? 'Sink' : 'Byproduct'}`] = amount;
	}
	return response;
}
