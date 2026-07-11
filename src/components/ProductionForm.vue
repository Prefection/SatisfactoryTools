<script setup lang="ts">
import {computed} from 'vue';
import model from '@src/Data/Model';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import ItemIcon from '@src/components/ItemIcon.vue';

const {data, addProduct, removeProduct, cloneProduct} = useActiveTab();
const {version} = useGameData();

// Craftable items, name-sorted; re-resolve on version switch (same pattern as the codex views).
const craftableItems = computed(() => {
	void version.value;
	return model.getAutomatableItems().slice().sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
	<div class="card">
		<div class="card-header">Production</div>
		<div class="card-body">
			<table class="table">
				<tbody>
					<tr v-for="(product, index) in data.request.production" :key="index">
						<td>
							<select class="form-control" v-model="product.item">
								<option :value="null" disabled>Select an item…</option>
								<option v-for="item in craftableItems" :key="item.className" :value="item.className">{{ item.name }}</option>
							</select>
						</td>
						<td style="width: 40px">
							<ItemIcon v-if="product.item" :item="product.item" :size="32" />
						</td>
						<td style="width: 140px">
							<input class="form-control" type="number" min="0" v-model.number="product.amount" /> / min
						</td>
						<td style="width: 90px">
							<button class="btn btn-secondary btn-sm" title="Clone" @click="cloneProduct(index)"><span class="fas fa-clone"></span></button>
							<button class="btn btn-danger btn-sm" title="Remove" @click="removeProduct(index)"><span class="fas fa-trash"></span></button>
						</td>
					</tr>
				</tbody>
			</table>
			<button class="btn btn-primary" @click="addProduct"><span class="fas fa-plus"></span> Add product</button>
		</div>
	</div>
</template>
