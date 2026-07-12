<script setup lang="ts">
import {computed} from 'vue';
import model from '@src/Data/Model';
import {VueDraggable} from 'vue-draggable-plus';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import {Constants} from '@src/Constants';
import ItemCombobox from '@src/components/ItemCombobox.vue';

const {data, addProduct, removeProduct, cloneProduct, clearProducts} = useActiveTab();
const {version} = useGameData();

// Stable per-row keys: index keys desync with SortableJS's DOM moves, which then lands a
// newly-added row mid-list. Keying by the row object's identity keeps reorder + add correct.
let keySeq = 0;
const rowKeys = new WeakMap<object, number>();
function rowKey(row: object): number {
	let k = rowKeys.get(row);
	if (k === undefined) rowKeys.set(row, (k = keySeq++));
	return k;
}

function confirmClearProducts(): void {
	if (data.request.production.length && !window.confirm('Clear the entire production line?')) return;
	clearProducts();
}

// Craftable items, name-sorted; re-resolve on version switch (same pattern as the codex views).
const craftableItems = computed(() => {
	void version.value;
	return model.getAutomatableItems().slice().sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
	<p>
		Select items that you want to produce. Enter the amount you want per minute; the tool produces it from
		as few raw resources as possible.
	</p>

	<table class="production-input-table">
		<VueDraggable v-model="data.request.production" :animation="150" tag="tbody" handle=".sortable-handler">
			<tr v-for="(product, index) in data.request.production" :key="rowKey(product)">
				<td class="sortable-handler"><span class="fas fa-arrows-alt-v cursor-drag"></span></td>
				<td><ItemCombobox v-model="product.item" :items="craftableItems" /></td>
					<td class="text-nowrap">
						<select class="form-control" v-show="product.item" v-model="product.type">
							<option :value="Constants.PRODUCTION_TYPE.PER_MINUTE">Per minute</option>
							<option :value="Constants.PRODUCTION_TYPE.MAXIMIZE">Maximize</option>
						</select>
					</td>
				<td>
					<div v-show="product.item && product.type === Constants.PRODUCTION_TYPE.PER_MINUTE" class="input-group">
						<input class="form-control" type="number" min="0" step="any" v-model.number="product.amount" />
						<div class="input-group-append"><span class="input-group-text">/ min</span></div>
					</div>
				</td>
				<td class="text-nowrap">
					<span class="btn btn-success" title="Clone item" @click="cloneProduct(index)"><span class="far fa-fw fa-clone"></span></span>
					<span class="btn btn-danger" title="Remove item" @click="removeProduct(index)"><span class="fas fa-fw fa-times"></span></span>
				</td>
			</tr>
		</VueDraggable>
	</table>

	<div class="d-flex mt-2">
		<span class="btn btn-outline-success flex-grow-1" @click="addProduct"><span class="fas fa-plus"></span> Add product</span>
		<span class="btn btn-outline-danger ml-2" title="Clear production line" @click="confirmClearProducts"><span class="fas fa-fw fa-trash-alt"></span></span>
	</div>
</template>
