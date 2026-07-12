export default function parseBlueprintClass(blueprint: string): string
{
	if (blueprint === null) {
		return '';
	}
	let match = blueprint.match(/"(.*?)"/);
	if (!match) {
		match = ['', blueprint];
	}
	if (match) {
		const parts = match[1].split('.');
		// 1.2 wraps the ref as BlueprintGeneratedClass'…Class_C', leaving a trailing quote on the
		// last segment; strip any trailing quote/apostrophe so the class name matches the item keys.
		return parts[parts.length - 1].replace(/['"]+$/, '');
	}
	return 'Undefined';
}
