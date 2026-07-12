import {ref, shallowRef, toRaw, watch} from 'vue';
import data from '@src/Data/Data';
import {DataProvider} from '@src/Data/DataProvider';
import {useActiveTab} from '@src/composables/useActiveTab';
import {useGameData} from '@src/composables/useGameData';
import {solveProduction} from '@src/Solver/ProductionSolver';
import {ProductionResultFactory} from '@src/Tools/Production/Result/ProductionResultFactory';
import {ProductionResult} from '@src/Tools/Production/Result/ProductionResult';
import {ResultStatus} from '@src/Tools/Production/ResultStatus';
import {IProductionDataApiRequest} from '@src/Tools/Production/IProductionData';

function apiGameVersion(version: string): string {
	return version === '1.0' ? '1.0.0' : '1.2.0';
}

export function useProductionSolve() {
	const {data: tab} = useActiveTab();
	const {version} = useGameData();
	const resultStatus = ref<ResultStatus>(ResultStatus.NO_INPUT);
	// shallowRef, not ref — ProductionResult is replaced wholesale each solve (never
	// mutated in place), and ref's UnwrapRef strips the class's private methods when the value
	// flows through a template, breaking assignability to components typed on ProductionResult.
	const resultNew = shallowRef<ProductionResult | undefined>(undefined);

	async function calculate(): Promise<void> {
		const hasInput = tab.request.production.some((p) => p.item && p.amount > 0);
		if (!hasInput) { resultStatus.value = ResultStatus.NO_INPUT; resultNew.value = undefined; return; }

		resultStatus.value = ResultStatus.CALCULATING;

		const apiRequest: IProductionDataApiRequest = {...structuredClone(toRaw(tab.request)), gameVersion: apiGameVersion(version.value)};

		// Expand blockedMachines -> filter allowed alternates (ProductionTab.ts:109-125)
		const blockedMachines = apiRequest.blockedMachines ?? [];
		apiRequest.allowedAlternateRecipes = apiRequest.allowedAlternateRecipes.filter((className) => {
			const recipe = data.getRecipeByClassName(className);
			return !recipe || !recipe.producedIn.some((m) => blockedMachines.includes(m));
		});
		// Expand blockedMachines -> rebuild blockedRecipes over base recipes (ProductionTab.ts:127-139)
		const blocked = new Set(apiRequest.blockedRecipes);
		for (const recipe of data.getBaseItemRecipes()) {
			if (recipe.producedIn.some((m) => blockedMachines.includes(m))) blocked.add(recipe.className);
		}
		apiRequest.blockedRecipes = [...blocked];
		delete apiRequest.blockedMachines;

		const result = await solveProduction(apiRequest, DataProvider.get());
		if (Object.keys(result).length === 0) { resultStatus.value = ResultStatus.NO_RESULT; resultNew.value = undefined; return; }

		resultNew.value = new ProductionResultFactory().create(apiRequest, result, DataProvider.get());
		resultStatus.value = ResultStatus.RESULT;
	}

	// inline 400ms debounce (matches the original) — no lodash/VueUse for one timer.
	// Uses window.setTimeout/clearTimeout (not the bare globals): @types/node leaks into this
	// program via vite.config.ts's `node:url` import, and its older NodeJS.Timeout typings for
	// clearTimeout don't accept `undefined`. Qualifying with `window.` pins the DOM lib overload.
	let timer: number | undefined;
	watch(() => tab.request, () => {
		window.clearTimeout(timer);
		timer = window.setTimeout(() => { void calculate(); }, 400);
	}, {deep: true, immediate: true});

	return {resultStatus, resultNew};
}
