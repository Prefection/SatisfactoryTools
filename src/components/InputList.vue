<script setup lang="ts">
import {computed} from 'vue';
import model from '@src/Data/Model';
import {VueDraggable} from 'vue-draggable-plus';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import ItemCombobox from '@src/components/ItemCombobox.vue';

const {data, addInput, removeInput, cloneInput, clearInput} = useActiveTab();
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

function confirmClearInput(): void {
	if (data.request.input.length && !window.confirm('Clear all inputs?')) return;
	clearInput();
}

// Items usable as pre-supplied input (non-raw-resource, plus waste), name-sorted;
// re-resolve on version switch (same pattern as ProductionForm's craftableItems).
const inputableItems = computed(() => {
	void version.value;
	return model.getInputableItems().slice().sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
	<div class="card">
		<h3 class="card-header card-header-with-buttons">
			<span class="card-header-text">Input</span>
		</h3>
		<div class="card-body">
			<p>Select items that you already have at your disposal and therefore don't need to be produced by this factory.</p>
			<div class="table-scroll">
			<table class="input-table">
				<VueDraggable v-model="data.request.input" :animation="150" tag="tbody" handle=".sortable-handler">
					<tr v-for="(input, index) in data.request.input" :key="rowKey(input)">
						<td class="sortable-handler"><span class="fas fa-arrows-alt-v cursor-drag"></span></td>
						<td><ItemCombobox v-model="input.item" :items="inputableItems" /></td>
						<td>
							<div v-show="input.item" class="input-group">
							<input class="form-control" type="number" min="0" step="any" v-model.number="input.amount" />
							<div class="input-group-append"><span class="input-group-text">/ min</span></div>
						</div>
						</td>
						<td class="text-nowrap">
							<span class="btn btn-success" title="Clone input" @click="cloneInput(index)"><span class="far fa-fw fa-clone"></span></span>
							<span class="btn btn-danger" title="Remove input" @click="removeInput(index)"><span class="fas fa-fw fa-times"></span></span>
						</td>
					</tr>
				</VueDraggable>
			</table>
			</div>

			<div class="d-flex mt-2">
				<span class="btn btn-outline-success flex-grow-1" @click="addInput"><span class="fas fa-plus"></span> Add input</span>
				<span class="btn btn-outline-danger ml-2" title="Clear inputs" @click="confirmClearInput"><span class="fas fa-fw fa-trash-alt"></span></span>
			</div>
		</div>
	</div>
</template>
