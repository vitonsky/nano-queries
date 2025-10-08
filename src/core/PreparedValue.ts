import { PrimitiveValue, Value } from '../types';

export class PreparedValue implements Value<PrimitiveValue> {
	protected readonly value;
	constructor(value: PrimitiveValue) {
		this.value = value;
	}

	public getValue = () => {
		return this.value;
	};
}
