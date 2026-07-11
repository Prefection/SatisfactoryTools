<script setup lang="ts">
import {computed, watchEffect} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import data from '@src/Data/Data';
import {useGameData} from '@src/composables/useGameData';
import {Strings} from '@src/Utils/Strings';
import ItemIcon from '@src/components/ItemIcon.vue';
import NetworkGraph from '@src/components/NetworkGraph.vue';
import type {GraphEdge, GraphNode} from '@src/utils/networkLayout';

const route = useRoute();
const router = useRouter();
const {version} = useGameData();

const schematic = computed(() => {
	void version.value; // re-resolve on version switch
	return data.getSchematicBySlug(route.params.item as string);
});

watchEffect(() => {
	if (!schematic.value) {
		router.replace({name: 'schematics'});
	}
});

const schematicType = computed(() => schematic.value ? Strings.convertSchematicType(schematic.value.type) : '');

const graph = computed<{nodes: GraphNode[]; edges: GraphEdge[]}>(() => {
	const current = schematic.value;
	const list = current ? data.getRelevantSchematics(current) : [];
	const idOf: Record<string, number> = {};
	const nodes: GraphNode[] = list.map((s, i) => {
		idOf[s.className] = i + 1;
		return {
			id: i + 1,
			label: `<b>${s.name}</b>\nTier: ${s.tier}`,
			slug: s.slug,
			color: current && s.className === current.className ? '#5cb85c' : undefined,
		};
	});
	const edges: GraphEdge[] = [];
	for (const s of list) {
		for (const dep of s.requiredSchematics) {
			if (idOf[dep] && idOf[s.className]) {
				edges.push({from: idOf[dep], to: idOf[s.className]});
			}
		}
	}
	return {nodes, edges};
});

function getItem(className: string) {
	return data.getItemByClassName(className);
}

function getSchematic(className: string) {
	return data.getSchematicByClassName(className);
}

function getRecipe(className: string) {
	return data.getRecipeByClassName(className);
}
</script>

<template>
	<template v-if="schematic">
		<RouterLink :to="{name: 'schematics'}">&larr; Back to schematics</RouterLink>

		<div class="row">
			<div class="col-md-6">
				<div class="card mb-3">
					<h2 class="card-header">Schematic: {{ schematic.name }}</h2>
					<div class="card-body">
						<table class="table two-columns">
							<tbody>
								<tr>
									<td>Type</td>
									<td>{{ schematicType }}</td>
								</tr>
								<tr>
									<td>Tier</td>
									<td>{{ schematic.tier }}</td>
								</tr>
								<tr>
									<td>Time to research:</td>
									<td>{{ schematic.time }} seconds</td>
								</tr>
								<tr>
									<td>Cost</td>
									<td>
										<span v-for="ingredient in schematic.cost" :key="ingredient.item" class="item-amount">
											{{ ingredient.amount }}x
											<RouterLink v-if="getItem(ingredient.item)" :to="{name: 'item', params: {item: getItem(ingredient.item)!.slug}}">
												<ItemIcon :item="ingredient.item" />
											</RouterLink>
										</span>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="col-md-6">
				<div class="card mb-3">
					<h2 class="card-header">Schematic details</h2>
					<div class="card-body">
						<table class="table two-columns">
							<tbody>
								<tr v-if="schematic.requiredSchematics.length">
									<td>Requires schematics:</td>
									<td>
										<div v-for="dep in schematic.requiredSchematics" :key="dep">
											<RouterLink v-if="getSchematic(dep)" :to="{name: 'schematic', params: {item: getSchematic(dep)!.slug}}">
												{{ getSchematic(dep)!.name }}
											</RouterLink>
										</div>
									</td>
								</tr>
								<tr v-if="schematic.unlock.recipes.length">
									<td>Unlocks recipes/buildings:</td>
									<td>
										<div v-for="recipe in schematic.unlock.recipes" :key="recipe">
											{{ getRecipe(recipe)?.name }}
										</div>
									</td>
								</tr>
								<tr v-if="schematic.unlock.scannerResources.length">
									<td>Unlocks scanner resources:</td>
									<td>
										<div v-for="scannerItem in schematic.unlock.scannerResources" :key="scannerItem">
											{{ getItem(scannerItem)?.name }}
										</div>
									</td>
								</tr>
								<tr v-if="schematic.unlock.inventorySlots > 0">
									<td>Adds inventory slots:</td>
									<td>+{{ schematic.unlock.inventorySlots }}</td>
								</tr>
								<tr v-if="schematic.unlock.giveItems.length">
									<td>Gives items to player:</td>
									<td>
										<div v-for="giveItem in schematic.unlock.giveItems" :key="giveItem.item">
											{{ giveItem.amount }}x
											<RouterLink v-if="getItem(giveItem.item)" :to="{name: 'item', params: {item: getItem(giveItem.item)!.slug}}">
												<ItemIcon :item="giveItem.item" />
											</RouterLink>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="col-12">
				<h3>
					Schematic dependency tree
					<span class="text-muted">(doubleclick on a node to open that schematic's page)</span>
				</h3>
				<NetworkGraph :key="route.params.item as string" :nodes="graph.nodes" :edges="graph.edges"
				              @navigate="(slug) => router.push({name: 'schematic', params: {item: slug}})" />
			</div>
		</div>
	</template>
</template>
