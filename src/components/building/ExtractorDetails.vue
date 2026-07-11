<script setup lang="ts">
import {ref, computed} from 'vue';
import data from '@src/Data/Data';
import {Formula} from '@src/Formula';
import {Numbers} from '@src/Utils/Numbers';
import {Strings} from '@src/Utils/Strings';
import {Constants, RESOURCE_PURITY} from '@src/Constants';
import type {IBuildingSchema} from '@src/Schema/IBuildingSchema';

const props = defineProps<{building: IBuildingSchema}>();

const overclock = ref(100);
const purity = ref<RESOURCE_PURITY>('normal');

const extractor = computed(() => data.getRawData().miners[props.building.className]);

const isWaterExtractor = computed(() => props.building.className === Constants.WATER_EXTRACTOR_CLASSNAME);

const powerConsumption = computed(() => Strings.formatNumber(Numbers.round(Formula.calculateBuildingPowerConsumption(props.building, overclock.value))));

// Formula.calculateExtractorExtractionValue is overclock-agnostic (base rate at 100%); scale it here to match the source getter.
const extractionRate = computed(() => Strings.formatNumber(Numbers.round(Formula.calculateExtractorExtractionValue(props.building, extractor.value, purity.value) * (overclock.value / 100))));

// ponytail: the source template's "manufacturing speed" row calls a controller method that doesn't
// exist on the extractor controller (Angular silently no-ops it), so it never renders. Omitted here too.
</script>

<template>
	<table class="table two-columns">
		<tbody>
			<tr>
				<td>Overclock</td>
				<td>
					{{ overclock }}%
					<input class="w-100" type="range" min="100" max="250" v-model.number="overclock">
				</td>
			</tr>
			<tr>
				<td>Power consumption</td>
				<td>{{ powerConsumption }} MW</td>
			</tr>
			<tr>
				<td>Liquid resource allowed</td>
				<td>{{ extractor.allowLiquids ? 'Yes' : 'No' }}</td>
			</tr>
			<tr>
				<td>Solid resource allowed</td>
				<td>{{ extractor.allowSolids ? 'Yes' : 'No' }}</td>
			</tr>
			<tr v-if="!isWaterExtractor">
				<td>
					Purity
				</td>
				<td>
					<span class="btn-group w-100 align-items-center justify-content-center">
						<span class="btn" :class="{'btn-primary': purity === 'impure', 'btn-secondary': purity !== 'impure'}" @click="purity = 'impure'">Impure</span>
						<span class="btn" :class="{'btn-primary': purity === 'normal', 'btn-secondary': purity !== 'normal'}" @click="purity = 'normal'">Normal</span>
						<span class="btn" :class="{'btn-primary': purity === 'pure', 'btn-secondary': purity !== 'pure'}" @click="purity = 'pure'">Pure</span>
					</span>
				</td>
			</tr>
			<tr>
				<td>
					Extraction rate
				</td>
				<td>
					{{ extractionRate }} / min
				</td>
			</tr>
		</tbody>
	</table>
</template>
