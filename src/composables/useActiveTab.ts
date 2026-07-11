import {reactive, watch} from 'vue';
import {Data} from '@src/Data/Data';
import {useGameData, type GameVersion} from '@src/composables/useGameData';
import {IProductionData, IProductionDataRequestItem, IProductionDataRequestInput} from '@src/Tools/Production/IProductionData';

export const PER_MINUTE = 'perMinute'; // Constants.PRODUCTION_TYPE.PER_MINUTE

function storageKey(version: GameVersion): string {
	if (version === '1.0') return 'production1';
	if (version === '1.0-ficsmas') return 'production-ficsmas';
	return 'tmpProduction';
}

function defaultData(): IProductionData {
	return {
		metadata: {name: null, icon: null, schemaVersion: 1, gameVersion: '0'},
		request: {
			allowedAlternateRecipes: [], blockedRecipes: [], blockedMachines: [], blockedResources: [],
			sinkableResources: [], production: [], input: [],
			resourceMax: {...Data.resourceAmounts}, resourceWeight: {...Data.resourceWeights},
		},
	};
}

function emptyProduct(): IProductionDataRequestItem {
	return {item: null, type: PER_MINUTE, amount: 10, ratio: 100};
}

function emptyInput(): IProductionDataRequestInput {
	return {item: null, amount: 10};
}

// ponytail: single reactive tab. 3c-3 re-backs this seam with Pinia (multi-tab) — consumers unchanged.
const {version} = useGameData();
const data = reactive<IProductionData>(defaultData());

function load(): void {
	const raw = localStorage.getItem(storageKey(version.value));
	let restored: IProductionData | null = null;
	if (raw) {
		try {
			const arr = JSON.parse(raw) as IProductionData[];
			if (Array.isArray(arr) && arr[0]) restored = arr[0];
		} catch { /* ignore corrupt storage, fall back to default */ }
	}
	Object.assign(data, restored ?? defaultData());
	if (data.request.production.length === 0) data.request.production.push(emptyProduct());
}
load();

// Persist the full tab data (as a 1-element array, forward-compatible with 3c-3 multi-tab).
watch(data, () => {
	localStorage.setItem(storageKey(version.value), JSON.stringify([data]));
}, {deep: true});

// Reload when the game version changes (different storage key + different default resources).
watch(version, () => load());

export function useActiveTab() {
	return {
		data,
		addProduct: () => data.request.production.push(emptyProduct()),
		removeProduct: (index: number) => data.request.production.splice(index, 1),
		cloneProduct: (index: number) => {
			const p = data.request.production[index];
			data.request.production.push({item: p.item, type: p.type, amount: p.amount, ratio: p.ratio});
		},
		addInput: () => data.request.input.push(emptyInput()),
		removeInput: (index: number) => data.request.input.splice(index, 1),
		cloneInput: (index: number) => {
			const i = data.request.input[index];
			data.request.input.push({item: i.item, amount: i.amount});
		},
		clearInput: () => { data.request.input = []; },
		clearProducts: () => { data.request.production = []; },
	};
}
