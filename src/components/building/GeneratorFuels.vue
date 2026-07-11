<script setup lang="ts">
import {ref, computed} from 'vue';
import data from '@src/Data/Data';
import {useGameData} from '@src/composables/useGameData';
import {Constants} from '@src/Constants';
import {Formula} from '@src/Formula';
import {Strings} from '@src/Utils/Strings';
import ItemIcon from '@src/components/ItemIcon.vue';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';
import type {IItemSchema} from '@src/Schema/IItemSchema';

const props = defineProps<{building: IBuildingSchema}>();
const {version} = useGameData();

// no overclock slider on this related panel in the source template — the details panel's
// slider drove a shared service; here it's a local, non-interactive 100% (see task ambiguity resolution).
const overclock = ref(100);

const generator = computed(() => data.getRawData().generators[props.building.className]);
const fuels = computed<IItemSchema[]>(() => generator.value.fuel.map((fuel) => data.getRawData().items[fuel]));

const water = computed(() => {
	void version.value;
	return data.getItemByClassName(Constants.WATER_CLASSNAME)!;
});
const waste = computed(() => {
	void version.value;
	return data.getItemByClassName(Constants.NUCLEAR_WASTE_CLASSNAME)!;
});
const nuclearFuelRodClassName = Constants.NUCLEAR_FUEL_ROD_CLASSNAME;

function fuelConsumption(fuel: IItemSchema): string {
	return Strings.formatNumber(Formula.calculateFuelConsumption(generator.value, fuel, overclock.value));
}

function waterConsumption(): string {
	return Strings.formatNumber(Formula.calculateGeneratorWaterConsumption(generator.value, overclock.value));
}

function wasteProduction(): string {
	return Strings.formatNumber(10 * (overclock.value / 100));
}
</script>

<template>
	<div class="card">
		<h2 class="card-header">Fuel</h2>
		<div class="card-body">
			<div class="table-responsive">
				<table class="table recipe-table table-hover">
					<tbody>
						<tr v-for="resource in fuels" :key="resource.className">
							<td>
								<span class="item-amount">
									<RouterLink :to="{name: 'item', params: {item: resource.slug}}">
										<ItemIcon :item="resource" />
									</RouterLink>
									<small>{{ fuelConsumption(resource) }} / min</small>
								</span>
								<span class="item-amount" v-if="generator.waterToPowerRatio > 0">
									<span class="fas fa-fw fa-plus"></span>
									<RouterLink :to="{name: 'item', params: {item: water.slug}}">
										<ItemIcon :item="water" />
									</RouterLink>
									<small>{{ waterConsumption() }} m3 / min</small>
								</span>
								<span class="item-amount" v-if="resource.className === nuclearFuelRodClassName">
									<span class="fas fa-fw fa-arrow-right"></span>
									<RouterLink :to="{name: 'item', params: {item: waste.slug}}">
										<ItemIcon :item="waste" />
									</RouterLink>
									<small>{{ wasteProduction() }} / min</small>
								</span>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>
