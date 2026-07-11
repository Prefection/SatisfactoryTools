<script setup lang="ts">
import {ref, onMounted, onBeforeUnmount} from 'vue';
import {RouterLink, RouterView} from 'vue-router';
import {useGameData, GAME_VERSIONS, type GameVersion} from '@src/composables/useGameData';

const {version, changeVersion} = useGameData();
const menuOpen = ref(false);
const openDropdown = ref<'codex' | 'version' | null>(null);

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
							   :class="{active: version === v}" @click="pick(v)">{{ v }}</a>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</nav>

	<div class="container-fluid px-xl-5 px-lg-4 px-md-3 px-sm-2 px-1" style="margin-top: 60px;">
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
