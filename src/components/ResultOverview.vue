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
			<div class="hud-card mb-3" v-if="result.details.hasInput">
				<div class="hud-card__header" @click="toggle('input')">
					<span class="fas fa-box-open"></span>
					<span class="flex-grow-1 text-left">Input</span>
					<span class="fas" :class="collapsed.input ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</div>
				<div class="hud-card__body" v-show="!collapsed.input">
					<table class="hud-table">
						<thead><tr><th>Used</th><th>Input</th><th>Limit</th></tr></thead>
						<tbody>
							<tr v-for="(v, item) in result.details.input" :key="item">
								<td class="table-cell-adjust-size text-right pr-2 hud-mono">{{ round(v.used) }}</td>
								<td class="table-cell-adjust-size pr-2"><ItemIcon :item="String(item)" :size="24" /> {{ itemName(String(item)) }}</td>
								<td class="text-muted hud-mono">{{ round(v.usedPercentage) }}% of {{ round(v.max) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="hud-card mb-3">
				<div class="hud-card__header" @click="toggle('resources')">
					<span class="fas fa-gem"></span>
					<span class="flex-grow-1 text-left">Resources</span>
					<span class="fas" :class="collapsed.resources ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</div>
				<div class="hud-card__body" v-show="!collapsed.resources">
					<table class="hud-table">
						<thead><tr><th>Used</th><th>Resource</th><th>Limit</th></tr></thead>
						<tbody>
							<template v-for="(v, res) in result.details.rawResources" :key="res">
								<tr v-if="v.used > 0" :class="{'text-muted': !v.enabled}">
									<td class="table-cell-adjust-size text-right pr-2 hud-mono">{{ round(v.used) }}</td>
									<td class="table-cell-adjust-size pr-2"><ItemIcon :item="String(res)" :size="24" /> {{ itemName(String(res)) }}</td>
									<td class="text-muted hud-mono">{{ round(v.usedPercentage) }}% of {{ v.max }}</td>
								</tr>
							</template>
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<div class="col-md-4">
			<div class="hud-card mb-3">
				<div class="hud-card__header" @click="toggle('production')">
					<span class="fas fa-chart-line"></span>
					<span class="flex-grow-1 text-left">Production</span>
					<span class="fas" :class="collapsed.production ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</div>
				<div class="hud-card__body" v-show="!collapsed.production">
					<table class="hud-table">
						<thead><tr><th>Produced</th><th>Item</th></tr></thead>
						<tbody>
							<tr v-for="(amount, item) in result.details.output" :key="item">
								<td class="table-cell-adjust-size text-right pr-2 hud-mono">{{ round(amount) }}</td>
								<td><ItemIcon :item="String(item)" :size="24" /> {{ itemName(String(item)) }}</td>
							</tr>
							<tr v-for="(amount, item) in result.details.byproducts" :key="'bp-' + item" class="text-muted">
								<td class="table-cell-adjust-size text-right pr-2 hud-mono">{{ round(amount) }}</td>
								<td><ItemIcon :item="String(item)" :size="24" /> {{ itemName(String(item)) }} (byproduct)</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			<div class="hud-card mb-3">
				<div class="hud-card__header" @click="toggle('buildings')">
					<span class="fas fa-industry"></span>
					<span class="flex-grow-1 text-left">Buildings</span>
					<span class="fas" :class="collapsed.buildings ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</div>
				<div class="hud-card__body" v-show="!collapsed.buildings">
					<table class="hud-table">
						<thead><tr><th>Amount</th><th>Building</th></tr></thead>
						<tbody>
							<tr v-for="(b, cls) in result.details.buildings.buildings" :key="cls">
								<td class="table-cell-adjust-size text-right hud-mono">{{ b.amount }}</td>
								<td><ItemIcon :item="String(cls)" :size="24" /> {{ buildingName(String(cls)) }}</td>
							</tr>
						</tbody>
						<tfoot><tr><td colspan="2"><b>Total: <span class="hud-value">{{ result.details.buildings.amount }}</span></b></td></tr></tfoot>
					</table>
				</div>
			</div>
		</div>

		<div class="col-md-4">
			<div class="hud-card mb-3">
				<div class="hud-card__header" @click="toggle('power')">
					<span class="fas fa-bolt"></span>
					<span class="flex-grow-1 text-left">Power</span>
					<span class="fas" :class="collapsed.power ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</div>
				<div class="hud-card__body hud-card__body--pad" v-show="!collapsed.power">
					<span class="hud-value">{{ round(result.details.power.total.average) }} MW</span>
					<span class="text-muted hud-mono" v-if="result.details.power.total.isVariable">(up to {{ round(result.details.power.total.max) }} MW)</span>
				</div>
			</div>

			<div class="hud-card mb-3" v-if="result.details.alternatesNeeded.length">
				<div class="hud-card__header" @click="toggle('alternates')">
					<span class="fas fa-sync-alt"></span>
					<span class="flex-grow-1 text-left">Alternate recipes needed</span>
					<span class="fas" :class="collapsed.alternates ? 'fa-chevron-down' : 'fa-chevron-up'"></span>
				</div>
				<div class="hud-card__body" v-show="!collapsed.alternates">
					<table class="hud-table">
						<tbody>
							<tr v-for="r in result.details.alternatesNeeded" :key="r.className">
								<td class="text-right table-cell-adjust-size">
									<ItemIcon v-for="p in r.products" :key="p.item" :item="p.item" :size="20" />
								</td>
								<td>{{ r.name }}</td>
							</tr>
						</tbody>
						<tfoot><tr><td colspan="2"><b>Total: <span class="hud-value">{{ result.details.alternatesNeeded.length }}</span></b></td></tr></tfoot>
					</table>
				</div>
			</div>
		</div>
	</div>
</template>
