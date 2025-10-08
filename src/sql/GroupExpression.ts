import { Query } from '../core/Query';
import { BaseValues, IQuery } from '../types';

export class GroupExpression<T = BaseValues> extends Query<T> implements IQuery<T> {
	public getSegments() {
		const segments = super.getSegments();

		if (segments.length === 0) return [];

		return [new Query<T>('('), ...segments, new Query<T>(')')];
	}
}
