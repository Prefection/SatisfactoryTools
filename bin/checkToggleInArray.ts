import assert from 'node:assert';
import {toggleInArray} from '@src/utils/toggleInArray';

const a: string[] = [];
toggleInArray(a, 'x'); assert.deepStrictEqual(a, ['x'], 'adds when absent');
toggleInArray(a, 'y'); assert.deepStrictEqual(a, ['x', 'y'], 'appends second');
toggleInArray(a, 'x'); assert.deepStrictEqual(a, ['y'], 'removes when present');
console.log('OK: toggleInArray adds/removes correctly.');
