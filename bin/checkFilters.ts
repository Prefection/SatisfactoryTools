import assert from 'node:assert';
import {filterItems, byName, ItemFilter} from '@src/utils/entityFilters';

const base: ItemFilter = {query: '', onlyRadioactive: false, onlyWithEnergyValue: false, stackSize: null, physicalState: null};
const items: any[] = [
	{name: 'Iron Ore', radioactiveDecay: 0, energyValue: 0, liquid: false, stackSize: 100},
	{name: 'Uranium', radioactiveDecay: 1, energyValue: 0, liquid: false, stackSize: 100},
	{name: 'Water', radioactiveDecay: 0, energyValue: 0, liquid: true, stackSize: 50000},
	{name: 'Fuel', radioactiveDecay: 0, energyValue: 750, liquid: true, stackSize: 50000},
];

assert.deepStrictEqual(filterItems(items, base).map((i) => i.name), ['Fuel', 'Iron Ore', 'Uranium', 'Water'], 'sorts by name');
assert.deepStrictEqual(filterItems(items, {...base, onlyRadioactive: true}).map((i) => i.name), ['Uranium'], 'radioactive');
assert.deepStrictEqual(filterItems(items, {...base, onlyWithEnergyValue: true}).map((i) => i.name), ['Fuel'], 'energy');
assert.deepStrictEqual(filterItems(items, {...base, physicalState: 'liquid'}).map((i) => i.name), ['Fuel', 'Water'], 'liquid');
assert.deepStrictEqual(filterItems(items, {...base, stackSize: 50}).map((i) => i.name), ['Fuel', 'Water'], 'liquid stackSize /1000');
assert.deepStrictEqual(filterItems(items, {...base, query: 'ir'}).map((i) => i.name), ['Iron Ore'], 'query substring');
assert.deepStrictEqual(byName(items, 'u').map((i) => i.name), ['Fuel', 'Uranium'], 'byName substring + sort');

console.log('OK: entityFilters filterItems/byName match expected output.');
