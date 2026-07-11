// Add the value if absent, remove it if present. Shared by every request-list toggle editor.
export function toggleInArray(arr: string[], value: string): void {
	const i = arr.indexOf(value);
	if (i === -1) arr.push(value);
	else arr.splice(i, 1);
}
