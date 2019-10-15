
class DeepWeakMap {
	constructor() {
		this._map = new WeakMap();
	}

	set(keys, value) {
		return keys.reduce((map, key, index) => {
			if (index === keys.length - 1) {
				return map.set(key, value);
			}

			if (!map.has(key)) {
				map.set(key, new WeakMap());
			}

			return map.get(key);
		}, this._map);
	}

	has(keys) {
		return keys.reduce(({ map, has }, key) => ({
			map: map.get(key),
			has: has && map.has(key),
		}), {
			map: this._map,
			has: true,
		}).has;
	}

	get(keys) {
		return keys.reduce((value, key) => value && value.get(key), this._map);
	}

	delete(keys) {
		return keys.reduce((map, key, index) => {
			if (index === keys.length - 1) {
				return map.delete(key);
			}

			if (!map.has(key)) {
				map.set(key, new WeakMap());
			}

			return map.get(key);
		}, this._map);
	}
}

module.exports = DeepWeakMap;
