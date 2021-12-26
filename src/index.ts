
type NestedWeakMap<K extends object, V> = WeakMap<K, V | NestedWeakMap<K, V>>;
type NestedWeakMapValue<V> = ReturnType<NestedWeakMap<object, V>['get']>;

function invariant(testValue: boolean): asserts testValue {
	if (!testValue) {
		throw new TypeError([
			'DeepWeakMap invariant violation:',
			'You are probably using key arrays of different lengths with the same DeepWeakMap instance.',
		].join(' '));
	}
}

export default class DeepWeakMap<Keys extends object[], V> {
	protected _map: NestedWeakMap<object, V> = new WeakMap<object, V | NestedWeakMap<object, V>>();

	set(keys: Keys, value: V): this {
		keys.reduce<NestedWeakMapValue<V>>((map, key, index) => {
			invariant(map instanceof WeakMap);

			if (index === keys.length - 1) {
				return map.set(key, value);
			}

			if (!map.has(key)) {
				map.set(key, new WeakMap());
			}

			return map.get(key);
		}, this._map);

		return this;
	}

	has(keys: Keys): boolean {
		return keys.reduce<{ map: NestedWeakMapValue<V>; has: boolean }>(({ map, has }, key) => ({
			map: map instanceof WeakMap ? map.get(key) : undefined,
			has: has && (map instanceof WeakMap ? map.has(key) : false),
		}), {
			map: this._map,
			has: true,
		}).has;
	}

	get(keys: Keys): V | undefined {
		const value = keys.reduce<NestedWeakMapValue<V>>((value, key) => (
			value instanceof WeakMap
				? value.get(key)
				: undefined
		), this._map);

		invariant(!(value instanceof WeakMap));

		return value;
	}

	delete(keys: Keys): boolean {
		const valueDidExist = keys.reduce<unknown | NestedWeakMap<object, unknown>>((map, key, index) => {
			if (typeof map === 'boolean') {
				return map;
			}

			invariant(map instanceof WeakMap);

			if (index === keys.length - 1) {
				return map.delete(key);
			}

			if (!map.has(key)) {
				return false;
			}

			return map.get(key);
		}, this._map);

		invariant(typeof valueDidExist === 'boolean');

		return valueDidExist;
	}
}
