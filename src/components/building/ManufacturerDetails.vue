<script setup lang="ts">
import {ref, computed} from 'vue';
import data from '@src/Data/Data';
import {Formula} from '@src/Formula';
import {Numbers} from '@src/Utils/Numbers';
import {Strings} from '@src/Utils/Strings';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';

const props = defineProps<{building: IBuildingSchema}>();

const overclock = ref(100);

const isAutonomousManufacturer = computed(() => data.isManufacturerBuilding(props.building) && !data.isManualManufacturer(props.building));

const powerConsumption = computed(() => Strings.formatNumber(Numbers.round(Formula.calculateBuildingPowerConsumption(props.building, overclock.value))));

const minPowerConsumption = computed(() => {
	const m = props.building.metadata;
	if (!m.minPowerConsumption || !m.powerConsumptionExponent) {
		return '';
	}
	return Strings.formatNumber(Numbers.round(m.minPowerConsumption * Math.pow(overclock.value / 100, m.powerConsumptionExponent)));
});

const maxPowerConsumption = computed(() => {
	const m = props.building.metadata;
	if (!m.maxPowerConsumption || !m.powerConsumptionExponent) {
		return '';
	}
	return Strings.formatNumber(Numbers.round(m.maxPowerConsumption * Math.pow(overclock.value / 100, m.powerConsumptionExponent)));
});

const manufacturingSpeed = computed(() => {
	const speed = props.building.metadata.manufacturingSpeed;
	return speed ? Strings.formatNumber(Numbers.round(speed * (overclock.value / 100))) : '';
});
</script>

<template>
	<table class="table two-columns">
		<tbody>
			<tr v-if="isAutonomousManufacturer">
				<td>Overclock</td>
				<td>
					{{ overclock }}%
					<input class="w-100" type="range" min="100" max="250" v-model.number="overclock">
				</td>
			</tr>
			<tr v-if="isAutonomousManufacturer">
				<td>Power consumption</td>
				<td>
					{{ powerConsumption }} MW<br>
					<span class="text-muted" v-if="building.metadata.isVariablePower">({{ minPowerConsumption }} - {{ maxPowerConsumption }} MW, depending on recipe)</span>
				</td>
			</tr>
			<tr v-if="isAutonomousManufacturer">
				<td>Manufacturing speed multiplier</td>
				<td>x{{ manufacturingSpeed }}</td>
			</tr>
		</tbody>
	</table>
</template>
