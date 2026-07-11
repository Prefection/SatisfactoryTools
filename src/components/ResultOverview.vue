<script setup lang="ts">
import data from '@src/Data/Data';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import ItemIcon from '@src/components/ItemIcon.vue';

const props = defineProps<{result: ProductionResult}>();
const d = () => props.result.details;

const itemName = (cls: string) => data.getItemByClassName(cls)?.name ?? cls;
const buildingName = (cls: string) => data.getBuildingByClassName(cls)?.name ?? cls;
</script>

<template>
	<div class="row">
		<div class="col-md-6" v-if="result.details.hasInput">
			<div class="card"><div class="card-header">Input</div><div class="card-body"><table class="table">
				<tr v-for="(v, item) in result.details.input" :key="item">
					<td><ItemIcon :item="String(item)" :size="32" /> {{ itemName(String(item)) }}</td>
					<td>{{ v.used }} / {{ v.max }} / min</td>
				</tr>
			</table></div></div>
		</div>

		<div class="col-md-6">
			<div class="card"><div class="card-header">Raw resources</div><div class="card-body"><table class="table">
				<tr v-for="(v, res) in result.details.rawResources" :key="res">
					<td v-if="v.used > 0"><ItemIcon :item="String(res)" :size="32" /> {{ itemName(String(res)) }}</td>
					<td v-if="v.used > 0">{{ v.used }} / min</td>
				</tr>
			</table></div></div>
		</div>

		<div class="col-md-6">
			<div class="card"><div class="card-header">Production</div><div class="card-body"><table class="table">
				<tr v-for="(amount, item) in result.details.output" :key="item">
					<td><ItemIcon :item="String(item)" :size="32" /> {{ itemName(String(item)) }}</td>
					<td>{{ amount }} / min</td>
				</tr>
				<tr v-for="(amount, item) in result.details.byproducts" :key="'bp-' + item" class="text-muted">
					<td><ItemIcon :item="String(item)" :size="32" /> {{ itemName(String(item)) }} (byproduct)</td>
					<td>{{ amount }} / min</td>
				</tr>
			</table></div></div>
		</div>

		<div class="col-md-6">
			<div class="card"><div class="card-header">Buildings ({{ result.details.buildings.amount }})</div><div class="card-body"><table class="table">
				<tr v-for="(b, cls) in result.details.buildings.buildings" :key="cls">
					<td><ItemIcon :item="String(cls)" :size="32" /> {{ buildingName(String(cls)) }}</td>
					<td>{{ b.amount }}</td>
				</tr>
			</table></div></div>
		</div>

		<div class="col-md-6">
			<div class="card"><div class="card-header">Power</div><div class="card-body">
				<span v-if="result.details.power.total.isVariable">{{ result.details.power.total.average }} – {{ result.details.power.total.max }} MW</span>
				<span v-else>{{ result.details.power.total.average }} MW</span>
			</div></div>
		</div>

		<div class="col-md-6" v-if="result.details.alternatesNeeded.length">
			<div class="card"><div class="card-header">Alternate recipes needed</div><div class="card-body"><ul>
				<li v-for="r in result.details.alternatesNeeded" :key="r.className">{{ r.name }}</li>
			</ul></div></div>
		</div>
	</div>
</template>
