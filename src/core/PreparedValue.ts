import { PrimitiveValue, Value } from '../types';

export class PreparedValue<V extends PrimitiveValue = PrimitiveValue>
	implements Value<V>
{
	protected readonly value: V;
	constructor(value: V) {
		this.value = value;
	}

	public getValue = () => {
		return this.value;
	};
}
