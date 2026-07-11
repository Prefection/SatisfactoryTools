<script setup lang="ts">
import {computed} from 'vue';
import model from '@src/Data/Model';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import ItemCombobox from '@src/components/ItemCombobox.vue';

const {data, addInput, removeInput, cloneInput, clearInput} = useActiveTab();
const {version} = useGameData();

// Items usable as pre-supplied input (non-raw-resource, plus waste), name-sorted;
// re-resolve on version switch (same pattern as ProductionForm's craftableItems).
const inputableItems = computed(() => {
	void version.value;
	return model.getInputableItems().slice().sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
	<div class="card">
		<div class="card-header">Input</div>
		<div class="card-body">
			<p>Select items that you already have at your disposal and therefore don't need to be produced by this factory.</p>
			<table class="table">
				<tbody>
					<tr v-for="(input, index) in data.request.input" :key="index">
						<td><ItemCombobox v-model="input.item" :items="inputableItems" /></td>
						<td style="width: 140px">
							<input class="form-control" type="number" v-model.number="input.amount" /> / min
						</td>
						<td style="width: 90px">
							<button class="btn btn-secondary btn-sm" title="Clone" @click="cloneInput(index)"><span class="fas fa-clone"></span></button>
							<button class="btn btn-danger btn-sm" title="Remove" @click="removeInput(index)"><span class="fas fa-trash"></span></button>
						</td>
					</tr>
				</tbody>
			</table>
			<button class="btn btn-primary" @click="addInput"><span class="fas fa-plus"></span> Add input</button>
			<button class="btn btn-secondary" @click="clearInput"><span class="fas fa-times"></span> Clear</button>
		</div>
	</div>
</template>
