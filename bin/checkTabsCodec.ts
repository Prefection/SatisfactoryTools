import assert from 'node:assert';
import {encodeTabs, decodeTabs} from '@src/utils/tabsCodec';
import {IProductionData} from '@src/Tools/Production/IProductionData';

const tab: IProductionData = {
	metadata: {name: 'Test', icon: null, schemaVersion: 1, gameVersion: '1.0.0'},
	request: {
		allowedAlternateRecipes: ['Recipe_Alternate_X_C'], blockedRecipes: [], blockedMachines: [], blockedResources: ['Desc_OreGold_C'],
		sinkableResources: [], production: [{item: 'Desc_IronIngot_C', type: 'perMinute', amount: 60, ratio: 100}], input: [],
		resourceMax: {Desc_OreIron_C: 92100}, resourceWeight: {Desc_OreIron_C: 1},
	},
};

assert.deepStrictEqual(decodeTabs(encodeTabs([tab])), [tab], 'bare payload round-trips identically');
assert.deepStrictEqual(decodeTabs(encodeTabs([tab], true)), [tab], 'banner payload round-trips identically');
assert.deepStrictEqual(decodeTabs(encodeTabs([tab, tab])).length, 2, 'multi-tab count preserved');
assert.throws(() => decodeTabs('9garbage'), /Invalid version/, 'bad version rejected');

console.log('OK: tabsCodec round-trips (bare + banner + multi) and rejects bad input.');
