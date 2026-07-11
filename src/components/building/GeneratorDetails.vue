<script setup lang="ts">
import {ref, computed} from 'vue';
import data from '@src/Data/Data';
import {Formula} from '@src/Formula';
import {Numbers} from '@src/Utils/Numbers';
import {Strings} from '@src/Utils/Strings';
import {Constants} from '@src/Constants';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';

const props = defineProps<{building: IBuildingSchema}>();

const overclock = ref(100);

const generator = computed(() => data.getRawData().generators[props.building.className]);

const canBeOverclocked = computed(() => generator.value.className !== Constants.GEOTHERMAL_GENERATOR_CLASSNAME);

const powerProduction = computed(() => Strings.formatNumber(Numbers.round(Formula.calculatePowerGeneratorPowerCapacity(generator.value, overclock.value))));
</script>

<template>
	<table class="table two-columns" v-if="building">
		<tbody>
			<tr v-if="canBeOverclocked">
				<td>Overclock</td>
				<td>
					{{ overclock }}%
					<input class="w-100" type="range" min="100" max="250" v-model.number="overclock">
				</td>
			</tr>
			<tr>
				<td>Power production</td>
				<td>{{ powerProduction }} MW</td>
			</tr>
			<tr>
				<td>Requires water</td>
				<td>
					{{ generator.waterToPowerRatio > 0 ? 'Yes' : 'No' }}
				</td>
			</tr>
		</tbody>
	</table>
</template>
