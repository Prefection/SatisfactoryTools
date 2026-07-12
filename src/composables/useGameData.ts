import {ref, readonly} from 'vue';
import {DataProvider} from '@src/Data/DataProvider';
import data from '@src/Data/Data';

export const GAME_VERSIONS = ['1.2', '1.0'] as const;
export type GameVersion = typeof GAME_VERSIONS[number];

const DEFAULT_VERSION: GameVersion = '1.2';
const STORAGE_KEY = 'version';

const version = ref<GameVersion>(DEFAULT_VERSION);

function isVersion(v: string | null): v is GameVersion {
	return v !== null && (GAME_VERSIONS as readonly string[]).includes(v);
}

export function changeVersion(v: GameVersion): void {
	DataProvider.change(v);
	version.value = v;
	localStorage.setItem(STORAGE_KEY, v);
}

export function initGameData(): void {
	const stored = localStorage.getItem(STORAGE_KEY);
	changeVersion(isVersion(stored) ? stored : DEFAULT_VERSION);
}

export function useGameData() {
	return {version: readonly(version), changeVersion, data};
}
