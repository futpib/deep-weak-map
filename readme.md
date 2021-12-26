# deep-weak-map

> WeakMap with an array of keys

[![npm](https://shields.io/npm/v/deep-weak-map)](https://www.npmjs.com/package/deep-weak-map) [![Coverage Status](https://coveralls.io/repos/github/futpib/deep-weak-map/badge.svg?branch=master)](https://coveralls.io/github/futpib/deep-weak-map?branch=master)

## Example

```typescript
import DeepWeakMap from 'deep-weak-map';

const [ a, b, c, d ] = [
	randomObject(),
	randomObject(),
	randomObject(),
	randomObject(),
];

const value = randomObject();

const map = new DeepWeakMap();

map.set([ a, b, c ], value);

map.has([ a, b, c ]); // → true
map.has([ a, b, d ]); // → false

map.get([ a, b, c ]); // → value
map.get([ a, b, d ]); // → undefined

map.delete([ a, b, c ]);
map.has([ a, b, c ]); // → false
```

## Install

```
yarn add deep-weak-map
```
