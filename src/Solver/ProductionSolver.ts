import {solve, type Model, type Solution} from 'yalps';
import {IJsonSchema} from '@src/Schema/IJsonSchema';
import {IRecipeSchema} from '@src/Schema/IRecipeSchema';
import {IProductionDataApiRequest, IProductionDataApiResponse} from '@src/Tools/Production/IProductionData';

const PER_MINUTE = 'perMinute';
const MAXIMIZE = 'max';
const AT_LEAST = 'atLeast'; // maximize with list-order priority, but never below the row's amount floor
const EPS = 1e-7;
// Small penalty so a maximize solve, among equally-maximal plans, prefers less raw-resource use.
// Far below any real output magnitude, so it never changes which plan is maximal.
const COST_PENALTY = 1e-6;
// Tiny per-machine penalty so, among equally-maximal plans, the solver prefers fewer machines and
// drops goal-neutral filler recipes (e.g. sinking surplus Iron Rod into Iron Rebar). Far below any
// real output magnitude, so it never reduces the maximum.
const ACTIVITY_PENALTY = 1e-6;

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

type Vars = {[name: string]: {[coef: string]: number}};
type Cons = {[name: string]: {min?: number; max?: number}};

// Shared model pieces (everything except direction/objective). Per-minute demand becomes the balance floor.
function buildBase(request: IProductionDataApiRequest, data: IJsonSchema): {variables: Vars; constraints: Cons} {
	const variables: Vars = {};
	const constraints: Cons = {};
	const items = new Set<string>();

	const demand: {[item: string]: number} = {};
	for (const p of request.production) {
		if (p.item && p.type === PER_MINUTE && p.amount > 0) {
			demand[p.item] = (demand[p.item] ?? 0) + p.amount;
			items.add(p.item);
		}
	}

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

	for (const res of Object.keys(data.resources)) {
		if (request.blockedResources.includes(res)) continue;
		variables['mine:' + res] = {['item:' + res]: 1, ['cap:' + res]: 1, cost: request.resourceWeight[res] ?? 0};
		constraints['cap:' + res] = {max: request.resourceMax[res] ?? 0};
		items.add(res);
	}

	for (const input of request.input) {
		if (input.item && input.amount > 0) {
			variables['input:' + input.item] = {['item:' + input.item]: 1, ['incap:' + input.item]: 1};
			constraints['incap:' + input.item] = {max: input.amount};
			items.add(input.item);
		}
	}

	for (const item of items) {
		constraints['item:' + item] = {min: demand[item] ?? 0};
	}

	return {variables, constraints};
}

function recipeKeys(variables: Vars): string[] {
	return Object.keys(variables).filter((k) => k.startsWith('recipe:'));
}

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

// Encode a solved LP/MILP solution into the API response shape. `productItems` are the items to
// report as #Product (their amount comes from `productAmount`); other net surplus routes to Sink/Byproduct.
function encode(solution: Solution, data: IJsonSchema, request: IProductionDataApiRequest,
                productAmount: {[item: string]: number}): IProductionDataApiResponse {
	const response: IProductionDataApiResponse = {};
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
	const targets = new Set(Object.keys(productAmount));
	for (const [item, amount] of Object.entries(productAmount)) {
		if (amount <= EPS) continue; // a maximize row starved to 0 by a higher-priority target -> no node
		response[`${item}#Product`] = amount;
	}
	const net = computeNet(solution, data);
	for (const [item, amount] of Object.entries(net)) {
		if (targets.has(item) || amount <= EPS) continue;
		response[`${item}#${request.sinkableResources.includes(item) ? 'Sink' : 'Byproduct'}`] = amount;
	}
	return response;
}

export function buildProductionModel(request: IProductionDataApiRequest, data: IJsonSchema): Model {
	const {variables, constraints} = buildBase(request, data);
	return {direction: 'minimize', objective: 'cost', constraints, variables};
}

export async function solveProduction(request: IProductionDataApiRequest, data: IJsonSchema): Promise<IProductionDataApiResponse> {
	// Maximize and "at least" rows both maximize in list order; only "at least" rows carry a floor.
	const maxRows = request.production.filter((p) => p.item && (p.type === MAXIMIZE || p.type === AT_LEAST));

	// No maximize rows -> today's single min-cost LP (per-minute demand only).
	if (maxRows.length === 0) {
		const solution = solve(buildProductionModel(request, data));
		if (solution.status !== 'optimal') return {};
		const productAmount: {[item: string]: number} = {};
		for (const p of request.production) {
			if (p.item && p.type === PER_MINUTE && p.amount > 0) {
				productAmount[p.item] = (productAmount[p.item] ?? 0) + p.amount;
			}
		}
		return encode(solution, data, request, productAmount);
	}

	// Maximize: one solve per max row in list order; lock each achieved output as a floor for the next.
	const base = buildBase(request, data);
	const integers = request.integerMachines ? recipeKeys(base.variables) : undefined;
	const locked: {[item: string]: number} = {}; // max item -> achieved output, becomes a >= floor
	let lastSolution: Solution | null = null;

	// Per-row "at least X/min" floor (0 = pure maximize). Reserved in EVERY pass so a higher-priority
	// maximize can't starve a lower one below its floor.
	const maxItems = maxRows.map((r) => r.item as string);
	const rowFloor: {[item: string]: number} = {};
	for (const r of maxRows) {
		const floor = r.type === AT_LEAST && r.amount > 0 ? r.amount : 0;
		rowFloor[r.item as string] = Math.max(rowFloor[r.item as string] ?? 0, floor);
	}

	for (const row of maxRows) {
		const X = row.item as string;
		const variables: Vars = {};
		for (const [k, v] of Object.entries(base.variables)) variables[k] = {...v};
		const constraints: Cons = {};
		for (const [k, v] of Object.entries(base.constraints)) constraints[k] = {...v};

		// One "out" variable per max item pulls that item out as product; its 'goal' coefficient is the
		// objective (current target scores 1, others 0). Every max item keeps a floor in every pass:
		// its locked value once maximized, otherwise its "at least" row floor — so all floors are held
		// while the current target is maximized.
		for (const item of maxItems) {
			variables['out:' + item] = {['item:' + item]: -1, ['out:' + item]: 1, goal: item === X ? 1 : 0};
			const floor = item in locked ? locked[item] : (rowFloor[item] ?? 0);
			if (floor > 0) constraints['out:' + item] = {min: floor};
		}
		// Tie-break penalties on the goal (both far below real output): mine vars pay COST_PENALTY *
		// resource-weight so maximal plans use less raw; recipe vars pay a flat ACTIVITY_PENALTY per
		// machine so maximal plans use fewer machines and drop goal-neutral filler (e.g. converting
		// surplus Iron Rod into Iron Rebar). Neither is ever large enough to reduce the maximum.
		for (const k of Object.keys(variables)) {
			let adj = 0;
			if (variables[k].cost) adj -= COST_PENALTY * variables[k].cost;
			if (k.startsWith('recipe:')) adj -= ACTIVITY_PENALTY;
			if (adj) variables[k] = {...variables[k], goal: (variables[k].goal ?? 0) + adj};
		}

		const model: Model = {direction: 'maximize', objective: 'goal', constraints, variables, ...(integers ? {integers} : {})};
		lastSolution = solve(model);
		if (lastSolution.status !== 'optimal') return {};
		locked[X] = lastSolution.variables.find(([n]) => n === 'out:' + X)?.[1] ?? 0;
	}

	// Report per-minute demands + each max item's achieved output as products.
	const productAmount: {[item: string]: number} = {...locked};
	for (const p of request.production) {
		if (p.item && p.type === PER_MINUTE && p.amount > 0) {
			productAmount[p.item] = (productAmount[p.item] ?? 0) + p.amount;
		}
	}
	return encode(lastSolution as Solution, data, request, productAmount);
}
