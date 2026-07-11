<script setup lang="ts">
import {computed} from 'vue';
import model from '@src/Data/Model';
import {VueDraggable} from 'vue-draggable-plus';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import ItemCombobox from '@src/components/ItemCombobox.vue';

const {data, addProduct, removeProduct, cloneProduct, clearProducts} = useActiveTab();
const {version} = useGameData();

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
			<tr v-for="(product, index) in data.request.production" :key="index">
				<td class="sortable-handler"><span class="fas fa-arrows-alt-v cursor-drag"></span></td>
				<td><ItemCombobox v-model="product.item" :items="craftableItems" /></td>
				<td>
					<input class="form-control" v-show="product.item" type="number" min="0" step="any" v-model.number="product.amount" /> / min
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
		<span class="btn btn-outline-danger ml-2" title="Clear production line" @click="clearProducts"><span class="fas fa-fw fa-trash-alt"></span></span>
	</div>
</template>
