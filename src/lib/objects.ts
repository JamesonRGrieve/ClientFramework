// SPDX-License-Identifier: AGPL-3.0-or-later
type PlainObject = Record<string, unknown>;

/** True when `value` is a non-array object (i.e. a mergeable plain object). */
const isPlainObject = (value: PlainObject[string]): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function deepMergeJSON(...objects: PlainObject[]): PlainObject {
  const deepCopyObjects = objects.map((object) => JSON.parse(JSON.stringify(object)) as PlainObject);
  return deepCopyObjects.reduce<PlainObject>((merged, current) => ({ ...merged, ...current }), {});
}

export default function deepMerge(obj1: PlainObject, obj2: PlainObject): PlainObject {
  const result: PlainObject = { ...obj1 };

  for (const key of Object.keys(obj2)) {
    const obj2Value = obj2[key];
    const obj1Value = obj1[key];
    if (isPlainObject(obj2Value) && isPlainObject(obj1Value)) {
      // If both are objects, recurse
      result[key] = deepMerge(obj1Value, obj2Value);
    } else {
      // Otherwise, overwrite with obj2's value
      result[key] = obj2Value;
    }
  }

  return result;
}
