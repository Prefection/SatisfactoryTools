<script setup lang="ts">
import {computed} from 'vue';
import data from '@src/Data/Data';
import ItemIcon from '@src/components/ItemIcon.vue';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';
import type {IItemSchema} from '@src/Schema/IItemSchema';

const props = defineProps<{building: IBuildingSchema}>();

const extractor = computed(() => data.getRawData().miners[props.building.className]);
const resources = computed<IItemSchema[]>(() => extractor.value.allowedResources.map((resource) => data.getRawData().items[resource]));
</script>

<template>
	<div class="card">
		<h2 class="card-header">Extractable resources</h2>
		<div class="card-body">
			<div class="table-responsive">
				<table class="table recipe-table table-hover">
					<tbody>
						<tr v-for="resource in resources" :key="resource.className">
							<td>
								<span class="item-amount">
									<RouterLink :to="{name: 'item', params: {item: resource.slug}}">
										<ItemIcon :item="resource" />
										{{ resource.name }}
									</RouterLink>
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>
