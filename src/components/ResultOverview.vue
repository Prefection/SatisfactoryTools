<script setup lang="ts">
import {reactive} from 'vue';
import data from '@src/Data/Data';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import ItemIcon from '@src/components/ItemIcon.vue';

defineProps<{result: ProductionResult}>();

// Local collapse state per overview card (matches the original's per-section chevrons).
const collapsed = reactive<Record<string, boolean>>({});
const toggle = (key: string) => { collapsed[key] = !collapsed[key]; };

const round = (n: number) => Math.round(n * 100) / 100;
const itemName = (cls: string) => data.getItemByClassName(cls)?.name ?? cls;
const buildingName = (cls: string) => data.getBuildingByClassName(cls)?.name ?? cls;
</script>

<template>
	<div class="row">
		<div class="col-md-4">
			<div class="card mb-3" v-if="result.details.hasInput">
				<h4 class="d-flex card-header cursor-pointer" @click="toggle('input')">
					<span class="fas fa-box-open mr-2"></span>
					<span class="flex-grow-1 text-left">Input</span>
					<span class="fas" :class="collapsed.input ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</h4>
				<div class="card-body p-0" v-show="!collapsed.input">
					<table class="table table-sm table-hover mb-0">
						<thead><tr><th>Used</th><th>Input</th><th>Limit</th></tr></thead>
						<tbody>
							<tr v-for="(v, item) in result.details.input" :key="item">
								<td class="table-cell-adjust-size text-right pr-2">{{ round(v.used) }}</td>
								<td class="table-cell-adjust-size pr-2"><ItemIcon :item="String(item)" :size="24" /> {{ itemName(String(item)) }}</td>
								<td class="text-muted">{{ round(v.usedPercentage) }}% of {{ round(v.max) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="card mb-3">
				<h4 class="d-flex card-header cursor-pointer" @click="toggle('resources')">
					<span class="fas fa-gem mr-2"></span>
					<span class="flex-grow-1 text-left">Resources</span>
					<span class="fas" :class="collapsed.resources ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</h4>
				<div class="card-body p-0" v-show="!collapsed.resources">
					<table class="table table-sm table-hover mb-0">
						<thead><tr><th>Used</th><th>Resource</th><th>Limit</th></tr></thead>
						<tbody>
							<template v-for="(v, res) in result.details.rawResources" :key="res">
								<tr v-if="v.used > 0" :class="{'text-muted': !v.enabled}">
									<td class="table-cell-adjust-size text-right pr-2">{{ round(v.used) }}</td>
									<td class="table-cell-adjust-size pr-2"><ItemIcon :item="String(res)" :size="24" /> {{ itemName(String(res)) }}</td>
									<td class="text-muted">{{ round(v.usedPercentage) }}% of {{ v.max }}</td>
								</tr>
							</template>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div class="col-md-4">
			<div class="card mb-3">
				<h4 class="d-flex card-header cursor-pointer" @click="toggle('production')">
					<span class="fas fa-chart-line mr-2"></span>
					<span class="flex-grow-1 text-left">Production</span>
					<span class="fas" :class="collapsed.production ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</h4>
				<div class="card-body p-0" v-show="!collapsed.production">
					<table class="table table-sm table-hover mb-0">
						<thead><tr><th>Produced</th><th>Item</th></tr></thead>
						<tbody>
							<tr v-for="(amount, item) in result.details.output" :key="item">
								<td class="table-cell-adjust-size text-right pr-2">{{ round(amount) }}</td>
								<td><ItemIcon :item="String(item)" :size="24" /> {{ itemName(String(item)) }}</td>
							</tr>
							<tr v-for="(amount, item) in result.details.byproducts" :key="'bp-' + item" class="text-muted">
								<td class="table-cell-adjust-size text-right pr-2">{{ round(amount) }}</td>
								<td><ItemIcon :item="String(item)" :size="24" /> {{ itemName(String(item)) }} (byproduct)</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="card mb-3">
				<h4 class="d-flex card-header cursor-pointer" @click="toggle('buildings')">
					<span class="fas fa-industry mr-2"></span>
					<span class="flex-grow-1 text-left">Buildings</span>
					<span class="fas" :class="collapsed.buildings ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</h4>
				<div class="card-body p-0" v-show="!collapsed.buildings">
					<table class="table table-sm table-hover mb-0">
						<thead><tr><th>Amount</th><th>Building</th></tr></thead>
						<tbody>
							<tr v-for="(b, cls) in result.details.buildings.buildings" :key="cls">
								<td class="table-cell-adjust-size text-right">{{ b.amount }}</td>
								<td><ItemIcon :item="String(cls)" :size="24" /> {{ buildingName(String(cls)) }}</td>
							</tr>
						</tbody>
						<tfoot><tr><td colspan="2"><b>Total: {{ result.details.buildings.amount }}</b></td></tr></tfoot>
					</table>
				</div>
			</div>
		</div>

		<div class="col-md-4">
			<div class="card mb-3">
				<h4 class="d-flex card-header cursor-pointer" @click="toggle('power')">
					<span class="fas fa-bolt mr-2"></span>
					<span class="flex-grow-1 text-left">Power</span>
					<span class="fas" :class="collapsed.power ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</h4>
				<div class="card-body" v-show="!collapsed.power">
					<b>{{ round(result.details.power.total.average) }} MW</b>
					<span class="text-muted" v-if="result.details.power.total.isVariable">(up to {{ round(result.details.power.total.max) }} MW)</span>
				</div>
			</div>

			<div class="card mb-3" v-if="result.details.alternatesNeeded.length">
				<h4 class="d-flex card-header cursor-pointer" @click="toggle('alternates')">
					<span class="fas fa-sync-alt mr-2"></span>
					<span class="flex-grow-1 text-left">Alternate recipes needed</span>
					<span class="fas" :class="collapsed.alternates ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</h4>
				<div class="card-body p-0" v-show="!collapsed.alternates">
					<table class="table table-sm table-hover mb-0">
						<tbody>
							<tr v-for="r in result.details.alternatesNeeded" :key="r.className">
								<td class="text-right table-cell-adjust-size">
									<ItemIcon v-for="p in r.products" :key="p.item" :item="p.item" :size="20" />
								</td>
								<td>{{ r.name }}</td>
							</tr>
						</tbody>
						<tfoot><tr><td colspan="2"><b>Total: {{ result.details.alternatesNeeded.length }}</b></td></tr></tfoot>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>
