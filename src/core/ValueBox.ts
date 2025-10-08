import { Value } from '../types';

export class ValueBox<V> implements Value<V> {
	protected readonly value: V;
	constructor(value: V) {
		this.value = value;
	}

	public getValue = () => {
		return this.value;
	};
}
