<script setup lang="ts">
import {ref} from 'vue';
import data from '@src/Data/Data';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import ItemIcon from '@src/components/ItemIcon.vue';

defineProps<{result: ProductionResult}>();

const expanded = ref(new Set<string>());
const toggle = (k: string) => { expanded.value.has(k) ? expanded.value.delete(k) : expanded.value.add(k); };

const itemName = (cls: string) => data.getItemByClassName(cls)?.name ?? cls;
const recipeName = (cls: string) => data.getRecipeByClassName(cls)?.name ?? cls;
const recipeProducts = (cls: string) => data.getRecipeByClassName(cls)?.products ?? [];
</script>

<template>
	<table class="table table-hover">
		<thead>
			<tr>
				<th class="table-cell-micro"></th>
				<th class="text-right">Item</th>
				<th class="text-right">Production</th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			<template v-for="(itemData, item) in result.details.items" :key="item">
				<tr class="cursor-pointer" @click="toggle(String(item))">
					<td>
						<span :class="expanded.has(String(item)) ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></span>
					</td>
					<td class="text-right table-cell-adjust-size">
						<ItemIcon :item="String(item)" :size="24" /> {{ itemName(String(item)) }}
					</td>
					<td class="text-right table-cell-adjust-size">
						{{ itemData.produced }} / min
					</td>
					<td class="text-left">
						<small class="text-muted">
							<span title="Total production" class="mx-3"><span class="fas fa-plus mr-1"></span>{{ itemData.produced }} / min</span>
							<span title="Total consumption" class="mx-3"><span class="fas fa-minus mr-1"></span>{{ itemData.consumed }} / min</span>
							<span title="Net amount" class="mx-3"><span class="fas fa-chart-line mr-1"></span>{{ itemData.diff }} / min</span>
						</small>

						<table v-if="expanded.has(String(item))" class="table table-hover mt-3">
							<tbody>
								<tr v-for="(producerData, producer) in itemData.producers" :key="'p-' + producer">
									<td v-if="producerData.type === 'recipe'" class="table-cell-micro text-right"><span class="fas fa-plus" title="Production"></span></td>
									<td v-else-if="producerData.type === 'miner'" class="table-cell-micro text-right"><span class="fas fa-external-link-alt" title="Extracting/mining"></span></td>
									<td v-else-if="producerData.type === 'input'" class="table-cell-micro text-right"><span class="fas fa-sign-in-alt" title="Input"></span></td>
									<td class="table-cell-adjust-size text-right">{{ producerData.itemAmount }} / min</td>
									<td class="table-cell-adjust-size text-right text-muted">
										<span v-if="producerData.type !== 'input'">({{ producerData.itemPercentage }}% of production)</span>
									</td>
									<td class="table-cell-adjust-size text-right pl-2">
										<span v-if="producerData.type === 'recipe'">
											<span v-for="product in recipeProducts(String(producer))" :key="product.item"><ItemIcon :item="product.item" :size="24" /></span>
										</span>
									</td>
									<td v-if="producerData.type === 'recipe'" class="table-cell-adjust-size text-left">{{ recipeName(String(producer)) }}</td>
									<td v-else-if="producerData.type === 'miner'" class="table-cell-adjust-size text-left"><b>Raw resource</b></td>
									<td v-else-if="producerData.type === 'input'" class="table-cell-adjust-size text-left"><b>Input</b></td>
									<td></td>
								</tr>
								<tr v-for="(consumerData, consumer) in itemData.consumers" :key="'c-' + consumer">
									<td class="table-cell-micro text-right"><span class="fas fa-minus" title="Consumption"></span></td>
									<td class="table-cell-adjust-size text-right">{{ consumerData.itemAmount }} / min</td>
									<td class="table-cell-adjust-size text-right text-muted">({{ consumerData.itemPercentage }}% of consumption)</td>
									<td class="table-cell-adjust-size text-right">
										<span v-for="product in recipeProducts(String(consumer))" :key="product.item"><ItemIcon :item="product.item" :size="24" /></span>
									</td>
									<td class="table-cell-adjust-size text-left">{{ recipeName(String(consumer)) }}</td>
									<td></td>
								</tr>
							</tbody>
						</table>
					</td>
				</tr>
			</template>
		</tbody>
	</table>
</template>
