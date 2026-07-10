<script setup lang="ts">
import {ref} from 'vue';
import {RouterLink, RouterView} from 'vue-router';
import {useGameData, GAME_VERSIONS, type GameVersion} from '@src/composables/useGameData';

const {version, changeVersion} = useGameData();
const menuOpen = ref(false);

function pick(v: GameVersion): void {
	changeVersion(v);
}
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
					<li class="nav-item">
						<details class="nav-dropdown">
							<summary class="nav-link"><i class="fas fa-fw fa-th-large"></i> Codex</summary>
							<div class="dropdown-menu show">
								<RouterLink class="dropdown-item" :to="{name: 'items'}"><i class="fas fa-fw fa-box-open"></i> Items</RouterLink>
								<RouterLink class="dropdown-item" :to="{name: 'buildings'}"><i class="fas fa-fw fa-industry"></i> Buildings</RouterLink>
								<RouterLink class="dropdown-item" :to="{name: 'schematics'}"><i class="fas fa-fw fa-flask"></i> Schematics</RouterLink>
							</div>
						</details>
					</li>
					<li class="nav-item">
						<RouterLink class="nav-link" :to="{name: 'production'}"><span class="fas fa-fw fa-chart-line"></span> Calculator</RouterLink>
					</li>
				</ul>
				<ul class="navbar-nav">
					<li class="nav-item">
						<details class="nav-dropdown">
							<summary class="nav-link"><b>Version: {{ version }}</b></summary>
							<div class="dropdown-menu dropdown-menu-right show">
								<a v-for="v in GAME_VERSIONS" :key="v" class="dropdown-item"
								   :class="{active: version === v}" @click="pick(v)">{{ v }}</a>
							</div>
						</details>
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

<style scoped>
.nav-dropdown > summary { list-style: none; cursor: pointer; }
.nav-dropdown > summary::-webkit-details-marker { display: none; }
.nav-dropdown[open] > .dropdown-menu { display: block; position: absolute; }
</style>
