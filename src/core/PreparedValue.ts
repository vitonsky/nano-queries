import { PrimitiveValue } from '../types';
import { ValueBox } from './ValueBox';

export class PreparedValue<
	V extends PrimitiveValue = PrimitiveValue,
> extends ValueBox<V> {}
