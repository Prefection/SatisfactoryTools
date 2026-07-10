import {IItemSchema} from '@src/Schema/IItemSchema';

export interface ItemFilter {
	query: string;
	onlyRadioactive: boolean;
	onlyWithEnergyValue: boolean;
	stackSize: number | null;
	physicalState: 'liquid' | 'solid' | null;
}

export function byName<T extends {name: string}>(entities: T[], query: string): T[] {
	const q = query.trim().toLowerCase();
	const out = q ? entities.filter((e) => e.name.toLowerCase().includes(q)) : entities.slice();
	return out.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterItems(items: IItemSchema[], filter: ItemFilter): IItemSchema[] {
	let out = items.slice();
	if (filter.onlyRadioactive) out = out.filter((i) => i.radioactiveDecay > 0);
	if (filter.onlyWithEnergyValue) out = out.filter((i) => i.energyValue > 0);
	if (filter.physicalState) out = out.filter((i) => ('liquid' === filter.physicalState) === i.liquid);
	if (filter.stackSize !== null) {
		out = out.filter((i) => filter.stackSize === (i.liquid ? i.stackSize / 1000 : i.stackSize));
	}
	if (filter.query) {
		const q = filter.query.toLowerCase();
		out = out.filter((i) => i.name.toLowerCase().includes(q));
	}
	return out.sort((a, b) => a.name.localeCompare(b.name));
}
