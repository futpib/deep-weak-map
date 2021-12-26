
import v8 from 'v8';

// eslint-disable-next-line ava/use-test
import type { ExecutionContext, Macro } from 'ava';
import test from 'ava';

import mem from 'mem';
import DeepWeakMap from '.';

const iterations = 2 ** 21;

const repeat = (f: (i: number) => void, n = iterations) => {
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

const runWithHeapSize = async <A extends any[]>(f: (...args: A) => void | Promise<void>, ...args: A) => {
	global.gc?.();

	await new Promise(resolve => {
		setTimeout(resolve, 3000);
	});

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

const retainsKeys: Macro<[(t: ExecutionContext) => void]> = async (t, f, ...args) => {
	const { initialUsedHeapSize, usedHeapSize } = await runWithHeapSize(f, t, ...args);

	t.true(usedHeapSize > initialUsedHeapSize * memoryGrowthThreshold);
};

retainsKeys.title = (providedTitle = '') => `${providedTitle} retains keys`;

const doesNotRetainKeys: Macro<[(t: ExecutionContext) => void]> = async (t, f, ...args) => {
	const { initialUsedHeapSize, usedHeapSize } = await runWithHeapSize(f, t, ...args);

	t.true(usedHeapSize < initialUsedHeapSize * memoryGrowthThreshold);
};

doesNotRetainKeys.title = (providedTitle = '') => `${providedTitle} does not retain keys`;

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

test.serial('DeepWeakMap API', t => {
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

	t.false(map.delete([ a, b, c ]));

	t.is(map.set([ a, b, c ], value), map);

	t.true(map.has([ a, b, c ]));
	t.false(map.has([ a, b, d ]));

	t.is(map.get([ a, b, c ]), value);
	t.is(map.get([ a, b, d ]), undefined);

	t.throws(() => {
		map.set([ a, b, c, d ], value);
	}, {
		message: /invariant violation/,
	});

	t.throws(() => {
		map.get([ a, b ]);
	}, {
		message: /invariant violation/,
	});

	t.throws(() => {
		map.delete([ a, b, c, d ]);
	}, {
		message: /invariant violation/,
	});

	t.true(map.delete([ a, b, c ]));
	t.false(map.has([ a, b, c ]));

	t.is(map.set([ a, b, c ], value), map);
	t.is(map.set([ a, b, d ], value), map);

	t.true(map.delete([ a, b ]));

	t.false(map.has([ a, b, c ]));
	t.false(map.has([ a, b, d ]));
});

test.serial('DeepWeakMap types', t => {
	type A = { a: number };
	type B = { b: number };

	type Value = { value: number };

	const a1 = { a: 1 };
	const b1 = { b: 1 };
	const value1 = { value: 1 };

	// @ts-expect-error 2344
	const brokenMap = new DeepWeakMap<[A, number, B], Value>();
	t.true(brokenMap instanceof DeepWeakMap);

	const map = new DeepWeakMap<[A, B], Value>();

	t.false(map.has([ a1, b1 ]));

	t.throws(() => {
		// @ts-expect-error 2322
		map.set([ a1, 1 ], value1);
	}, {
		name: 'TypeError',
	});

	map.set([ a1, b1 ], value1);

	t.throws(() => {
		// @ts-expect-error 2345
		map.set([ a1, b1, a1 ], value1);
	}, {
		name: 'TypeError',
	});
});

test.serial('Integration with mem', t => {
	type A = { a: number };
	type B = { b: number };

	type Value = { value: number };

	let callCount = 0;
	const f = mem((a: A, b: B): Value => ({
		value: a.a + b.b + callCount++,
	}), {
		cacheKey: arguments_ => arguments_,
		cache: new DeepWeakMap(),
	});

	const a0 = { a: 0 };
	const b0 = { b: 0 };

	t.is(f(a0, b0).value, 0);
	t.is(f(a0, b0).value, 0);

	t.is(callCount, 1);
});
