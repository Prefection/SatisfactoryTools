<script setup lang="ts">
import {ref, computed, watchEffect, onMounted, onBeforeUnmount} from 'vue';
import {RouterLink, RouterView, useRoute} from 'vue-router';
import data from '@src/Data/Data';
import {useGameData, GAME_VERSIONS, type GameVersion} from '@src/composables/useGameData';

const {version, changeVersion} = useGameData();
const route = useRoute();

type Crumb = {label: string; to?: {name: string}};
const HOME: Crumb = {label: 'Home', to: {name: 'home'}};

// Route-driven breadcrumb trail, mirroring the original's section → detail hierarchy.
const breadcrumbs = computed<Crumb[]>(() => {
	void version.value; // re-resolve entity names on version switch
	const slug = route.params.item as string | undefined;
	switch (route.name) {
		case 'items': return [HOME, {label: 'Items'}];
		case 'item': return [HOME, {label: 'Items', to: {name: 'items'}}, {label: data.getItemBySlug(slug!)?.name ?? slug ?? 'Item'}];
		case 'buildings': return [HOME, {label: 'Buildings'}];
		case 'building': return [HOME, {label: 'Buildings', to: {name: 'buildings'}}, {label: data.getBuildingBySlug(slug!)?.name ?? slug ?? 'Building'}];
		case 'schematics': return [HOME, {label: 'Schematics'}];
		case 'schematic': return [HOME, {label: 'Schematics', to: {name: 'schematics'}}, {label: data.getSchematicBySlug(slug!)?.name ?? slug ?? 'Schematic'}];
		case 'production': return [HOME, {label: 'Calculator'}];
		default: return [HOME];
	}
});
const menuOpen = ref(false);
const openDropdown = ref<'codex' | 'version' | null>(null);

const VERSION_LABELS: Record<GameVersion, string> = {
	'1.2': '1.2',
	'1.0': '1.0',
};

// Reactive tab title showing the active game version.
watchEffect(() => {
	document.title = `[${version.value}] Satisfactory Tools`;
});

function toggle(which: 'codex' | 'version'): void {
	openDropdown.value = openDropdown.value === which ? null : which;
}

function closeDropdowns(): void {
	openDropdown.value = null;
}

function pick(v: GameVersion): void {
	changeVersion(v);
	closeDropdowns();
}

// Bootstrap's dropdown JS is no longer bundled; replicate its click-outside dismiss.
function onDocumentClick(e: MouseEvent): void {
	if (!(e.target as HTMLElement).closest('.nav-item.dropdown')) {
		closeDropdowns();
	}
}
onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));
</script>

<template>
	<nav class="navbar fixed-top navbar-expand-md navbar-dark bg-primary">
		<div class="container-fluid px-xl-5 px-lg-4 px-md-3 px-sm-2 px-1">
			<RouterLink class="navbar-brand" :to="{name: 'home'}">
				<img src="/assets/images/logo/satisfactorySmall.png" height="40" class="d-sm-inline-block d-none" alt="" />
				<img src="/assets/images/logo/tools.png" height="40" alt="Satisfactory Tools" />
			</RouterLink>
			<button class="navbar-toggler" type="button" @click="menuOpen = !menuOpen" aria-label="Toggle navigation">
				<span class="navbar-toggler-icon"></span>
			</button>

			<div class="collapse navbar-collapse" :class="{show: menuOpen}">
				<ul class="navbar-nav mr-auto">
					<li class="nav-item">
						<RouterLink class="nav-link" :to="{name: 'home'}"><span class="fas fa-fw fa-home"></span> Home</RouterLink>
					</li>
					<li class="nav-item dropdown" :class="{show: openDropdown === 'codex'}">
						<a class="nav-link dropdown-toggle" @click.stop="toggle('codex')">
							<i class="fas fa-fw fa-th-large"></i> Codex
						</a>
						<div class="dropdown-menu" :class="{show: openDropdown === 'codex'}">
							<RouterLink class="dropdown-item" :to="{name: 'items'}" @click="closeDropdowns"><i class="fas fa-fw fa-box-open"></i> Items</RouterLink>
							<RouterLink class="dropdown-item" :to="{name: 'buildings'}" @click="closeDropdowns"><i class="fas fa-fw fa-industry"></i> Buildings</RouterLink>
							<RouterLink class="dropdown-item" :to="{name: 'schematics'}" @click="closeDropdowns"><i class="fas fa-fw fa-flask"></i> Schematics</RouterLink>
						</div>
					</li>
					<li class="nav-item">
						<RouterLink class="nav-link" :to="{name: 'production'}"><span class="fas fa-fw fa-chart-line"></span> Calculator</RouterLink>
					</li>
				</ul>
				<ul class="navbar-nav">
					<li class="nav-item dropdown" :class="{show: openDropdown === 'version'}">
						<a class="nav-link dropdown-toggle" @click.stop="toggle('version')"><b>Version: {{ version }}</b></a>
						<div class="dropdown-menu dropdown-menu-right" :class="{show: openDropdown === 'version'}">
							<a v-for="v in GAME_VERSIONS" :key="v" class="dropdown-item"
							   :class="{active: version === v}" @click="pick(v)">{{ VERSION_LABELS[v] }}</a>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</nav>

	<div class="container-fluid px-xl-5 px-lg-4 px-md-3 px-sm-2 px-1" style="margin-top: 60px;">
		<ol class="breadcrumb">
				<li v-for="(crumb, i) in breadcrumbs" :key="i" class="breadcrumb-item" :class="{active: i === breadcrumbs.length - 1}">
					<RouterLink v-if="crumb.to && i !== breadcrumbs.length - 1" :to="crumb.to">{{ crumb.label }}</RouterLink>
					<span v-else>{{ crumb.label }}</span>
				</li>
			</ol>
			<RouterView />
		<hr />
		<footer>
			<p class="text-secondary">
				Personal fork. Original tool by <a href="https://github.com/greeny">greeny</a>;
				source at <a href="https://github.com/Prefection/SatisfactoryTools">this fork</a>.
			</p>
		</footer>
	</div>
</template>
