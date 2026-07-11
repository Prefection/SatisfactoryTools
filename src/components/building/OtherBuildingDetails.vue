<script setup lang="ts">
import {computed} from 'vue';
import {Formula} from '@src/Formula';
import {Strings} from '@src/Utils/Strings';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';

const props = defineProps<{building: IBuildingSchema}>();

// ponytail: no overclock slider in the source template for this building kind — fixed at 100%.
const OVERCLOCK = 100;

const powerConsumption = computed(() => Strings.formatNumber(Formula.calculateBuildingPowerConsumption(props.building, OVERCLOCK)));

const manufacturingSpeed = computed(() => {
	const speed = props.building.metadata.manufacturingSpeed;
	return speed ? Strings.formatNumber(speed * (OVERCLOCK / 100)) : '';
});
</script>

<template>
	<table class="table two-columns">
		<tbody>
			<tr v-if="building.metadata.powerConsumption">
				<td>Power consumption</td>
				<td>{{ powerConsumption }} MW</td>
			</tr>
			<tr v-if="building.metadata.manufacturingSpeed">
				<td>Manufacturing speed multiplier</td>
				<td>x{{ manufacturingSpeed }}</td>
			</tr>
			<tr v-if="building.metadata.beltSpeed">
				<td>Belt speed</td>
				<td>{{ building.metadata.beltSpeed }} / min</td>
			</tr>
			<tr v-if="building.metadata.maxLength">
				<td>Maximum length</td>
				<td>{{ building.metadata.maxLength / 100 }} m</td>
			</tr>
			<tr v-if="building.metadata.maxPressure">
				<td>Maximum headlift</td>
				<td>{{ building.metadata.maxPressure }} m</td>
			</tr>
		</tbody>
	</table>
</template>
