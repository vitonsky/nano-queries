import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { BaseValues, IQuery, QuerySegment, RawQueryParameter } from '../types';
import { ConditionClause } from './ConditionClause';

export class WhereClause<T = BaseValues> extends Query<T> implements IQuery<T> {
	protected readonly condition = new ConditionClause<T>();
	constructor() {
		super();
	}

	public size() {
		return this.condition.size();
	}

	public and(...query: RawQueryParameter<T>[]) {
		this.condition.and(...query);

		return this;
	}

	public or(...query: RawQueryParameter<T>[]) {
		this.condition.or(...query);

		return this;
	}

	public getSegments(): QuerySegment<T>[] {
		if (this.condition.size() === 0) return [];

		return new QueryBuilder<T>({ join: ' ' })
			.raw('WHERE', this.condition)
			.getSegments();
	}
}
