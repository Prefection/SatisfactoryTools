import {reactive, ref, watch, toRaw} from 'vue';
import dataSingleton, {Data} from '@src/Data/Data';
import {useGameData, type GameVersion} from '@src/composables/useGameData';
import {IProductionData, IProductionDataRequestItem, IProductionDataRequestInput} from '@src/Tools/Production/IProductionData';
import {decodeTabs} from '@src/utils/tabsCodec';

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

function clone(d: IProductionData): IProductionData {
	return structuredClone(toRaw(d));
}

let idSeq = 1;
function newId(): string {
	return `t${idSeq++}`;
}

const {version} = useGameData();

// tabs holds the persisted snapshots; `data` is the reactive working-copy of the active tab.
const tabs = reactive<{id: string; data: IProductionData}[]>([]);
const activeId = ref<string>('');
const selectedIds = reactive(new Set<string>());
const data = reactive<IProductionData>(defaultData());

function activeTab() {
	return tabs.find((t) => t.id === activeId.value);
}

// Push the working-copy back into its tab snapshot (so tab labels + persistence see current edits).
function syncActiveToTab(): void {
	const t = activeTab();
	if (t) t.data = clone(data);
}

function loadIntoWorking(d: IProductionData): void {
	Object.assign(data, clone(d));
	if (data.request.production.length === 0) data.request.production.push(emptyProduct());
}

function persist(): void {
	syncActiveToTab();
	localStorage.setItem(storageKey(version.value), JSON.stringify(tabs.map((t) => t.data)));
}

function load(): void {
	const raw = localStorage.getItem(storageKey(version.value));
	let restored: IProductionData[] = [];
	if (raw) {
		try {
			const arr = JSON.parse(raw);
			if (Array.isArray(arr)) restored = arr.filter(Boolean);
		} catch { /* ignore corrupt storage */ }
	}
	if (restored.length === 0) restored = [defaultData()];
	tabs.splice(0, tabs.length, ...restored.map((d) => ({id: newId(), data: d})));
	selectedIds.clear();
	activeId.value = tabs[0].id;
	loadIntoWorking(tabs[0].data);
}
load();

// Load a shared factory from the URL (?f=<encoded>) if present, then strip the param.
// URLSearchParams already percent-decodes, so the raw payload feeds decodeTabs directly.
(function loadSharedFromUrl(): void {
	const params = new URLSearchParams(window.location.search);
	const f = params.get('f');
	if (!f) return;
	try {
		const imported = decodeTabs(f);
		if (imported.length) {
			const t = {id: newId(), data: imported[0]};
			tabs.push(t);
			setActive(t.id);
		}
	} catch { /* ignore malformed share payload */ }
	params.delete('f');
	const qs = params.toString();
	window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : ''));
})();

// Persist on any working-copy edit (syncs into the active tab first).
watch(data, persist, {deep: true});
// Reload on game-version change (different key + default resources).
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

function setActive(id: string): void {
	if (id === activeId.value) return;
	syncActiveToTab();            // save current edits back to the outgoing tab
	activeId.value = id;
	const t = activeTab();
	if (t) loadIntoWorking(t.data);  // load the incoming tab into the working-copy
	persist();
}

function tabName(tab: {data: IProductionData}): string {
	if (tab.data.metadata.name) return tab.data.metadata.name;
	const first = tab.data.request.production.find((p) => p.item);
	if (first?.item) return `${dataSingleton.getItemByClassName(first.item)?.name ?? first.item} Factory`;
	return 'Unnamed Factory';
}
function tabIcon(tab: {data: IProductionData}): string | null {
	if (tab.data.metadata.icon) return tab.data.metadata.icon;
	return tab.data.request.production.find((p) => p.item)?.item ?? null;
}

function addTabFromData(d: IProductionData, select = true): string {
	syncActiveToTab();
	const t = {id: newId(), data: d};
	tabs.push(t);
	if (select) setActive(t.id); else persist();
	return t.id;
}

export function useTabs() {
	return {
		tabs, activeId, selectedIds,
		setActive,
		toggleSelected: (id: string) => { selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id); },
		addTab: () => addTabFromData(defaultData()),
		addTabFromData,
		cloneTab: (id: string) => {
			const src = tabs.find((t) => t.id === id);
			if (src) addTabFromData(clone(src.data));
		},
		removeTab: (id: string) => {
			const idx = tabs.findIndex((t) => t.id === id);
			if (idx === -1) return;
			tabs.splice(idx, 1);
			selectedIds.delete(id);
			if (tabs.length === 0) tabs.push({id: newId(), data: defaultData()});
			if (activeId.value === id) {
				activeId.value = tabs[Math.min(idx, tabs.length - 1)].id;
				loadIntoWorking(activeTab()!.data);
			}
			persist();
		},
		removeSelected: () => {
			const ids = [...selectedIds];
			for (const id of ids) {
				const idx = tabs.findIndex((t) => t.id === id);
				if (idx !== -1) tabs.splice(idx, 1);
			}
			selectedIds.clear();
			if (tabs.length === 0) tabs.push({id: newId(), data: defaultData()});
			if (!activeTab()) { activeId.value = tabs[0].id; loadIntoWorking(tabs[0].data); }
			persist();
		},
		tabName, tabIcon,
		persist,
	};
}
