
import v8 from 'v8';

import test from 'ava';

import DeepWeakMap from '.';

const iterations = 2 ** 21;

const repeat = (f, n = iterations) => {
	for (let i = 0; i <= n; i++) {
		f(i);
	}
};

const memoryGrowthThreshold = 4;

const randomObject = () => ({
	random: Math.random(),
});

const randomKey3 = () => [
	randomObject(),
	randomObject(),
	randomObject(),
];

const runWithHeapSize = async (f, ...args) => {
	global.gc();

	await new Promise(resolve => setTimeout(resolve, 3000));

	const {
		used_heap_size: initialUsedHeapSize,
	} = v8.getHeapStatistics();

	await f(...args);

	const {
		used_heap_size: usedHeapSize,
	} = v8.getHeapStatistics();

	return {
		initialUsedHeapSize,
		usedHeapSize,
	};
};

const retainsKeys = async (t, f, ...args) => {
	const { initialUsedHeapSize, usedHeapSize } = await runWithHeapSize(f, t, ...args);

	t.true(usedHeapSize > initialUsedHeapSize * memoryGrowthThreshold);
};

retainsKeys.title = providedTitle => `${providedTitle} retains keys`;

const doesNotRetainKeys = async (t, f, ...args) => {
	const { initialUsedHeapSize, usedHeapSize } = await runWithHeapSize(f, t, ...args);

	t.true(usedHeapSize < initialUsedHeapSize * memoryGrowthThreshold);
};

doesNotRetainKeys.title = providedTitle => `${providedTitle} does not retain keys`;

test.serial('Map', retainsKeys, () => {
	const map = new Map();

	repeat(() => {
		map.set(randomKey3(), randomObject());
	});
});

test.serial('WeakMap', doesNotRetainKeys, () => {
	const map = new WeakMap();

	repeat(() => {
		map.set(randomKey3(), randomObject());
	});
});

test.serial('DeepWeakMap', doesNotRetainKeys, () => {
	const map = new DeepWeakMap();

	repeat(() => {
		map.set(randomKey3(), randomObject());
	});
});

test.serial('DeepWeakMap', t => {
	const [ a, b, c, d ] = [
		randomObject(),
		randomObject(),
		randomObject(),
		randomObject(),
	];

	const value = randomObject();

	const map = new DeepWeakMap();

	t.false(map.has([ a, b, c ]));
	t.false(map.has([ a, b, d ]));

	t.is(map.get([ a, b, c ]), undefined);
	t.is(map.get([ a, b, d ]), undefined);

	t.notThrows(() => {
		map.delete([ a, b, c ]);
	});

	map.set([ a, b, c ], value);

	t.true(map.has([ a, b, c ]));
	t.false(map.has([ a, b, d ]));

	t.is(map.get([ a, b, c ]), value);
	t.is(map.get([ a, b, d ]), undefined);

	map.delete([ a, b, c ]);
	t.false(map.has([ a, b, c ]));
});
