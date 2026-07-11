import * as pako from 'pako';
import {Strings} from '@src/Utils/Strings';
import {Data} from '@src/Data/Data';
import {IProductionData} from '@src/Tools/Production/IProductionData';

const VERSION = '0';

export function encodeTabs(tabs: IProductionData[], banner = false): string {
	const payload = VERSION + Strings.base64encode(Strings.bufferToString(pako.deflate(JSON.stringify({type: 'tabs', tabs})).buffer));
	if (!banner) return payload;
	const names = tabs.map((t) => '# - ' + (t.metadata.name ?? 'Unnamed Factory')).join('\n');
	return `# Satisfactory Tools export\n\n# Contains:\n${names}\n\n${payload}\n`;
}

export function decodeTabs(str: string): IProductionData[] {
	const payload = str.split('\n').map((l) => l.trim()).filter((l) => l !== '' && l.charAt(0) !== '#').join('');
	if (payload.charAt(0) !== VERSION) throw new Error('Invalid version: ' + payload.charAt(0));
	const parsed = JSON.parse(pako.inflate(Strings.stringToBuffer(Strings.base64decode(payload.substring(1))), {to: 'string'}));
	if (parsed.type !== 'tabs') throw new Error('Invalid file type');
	return parsed.tabs as IProductionData[];
}

// Back-compat patches carried over from the AngularJS import path.
export function patchImportedTab(tab: IProductionData): IProductionData {
	if (JSON.stringify(tab.request.resourceMax) === JSON.stringify(Data.resourceAmountsU8)) {
		tab.request.resourceMax = {...Data.resourceAmounts};
	}
	if (typeof tab.request.resourceMax.Desc_SAM_C === 'undefined') {
		tab.request.resourceMax.Desc_SAM_C = 0;
	}
	tab.request.resourceWeight = {...Data.resourceWeights};
	return tab;
}
