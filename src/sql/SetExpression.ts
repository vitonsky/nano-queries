import { QueryBuilder } from '../QueryBuilder';
import { BaseValues, IQuery, QuerySegment, RawQueryParameter } from '../types';
import { GroupExpression } from './GroupExpression';

export class SetExpression<T = BaseValues> extends QueryBuilder<T> implements IQuery<T> {
	constructor(...segments: RawQueryParameter<T>[]) {
		super({ join: null });

		this.raw(...segments);
	}

	public withParenthesis(): GroupExpression<T> {
		return new GroupExpression<T>(this);
	}

	public getSegments(): QuerySegment<T>[] {
		const query = new QueryBuilder<T>();

		super.getSegments().forEach((item, index) => {
			const preparedItem =
				item instanceof SetExpression<T> ? item.withParenthesis() : item;
			query.raw(index > 0 ? ',' : undefined, preparedItem);
		});

		return query.getSegments();
	}
}
