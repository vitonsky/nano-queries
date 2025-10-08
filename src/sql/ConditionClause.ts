import { filterOutEmptySegments, Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { BaseValues, IQuery, QuerySegment, RawQueryParameter } from '../types';

export class ConditionClause<T = BaseValues> extends Query<T> implements IQuery<T> {
	protected readonly clauses: Array<{
		clause: QuerySegment<T>;
		join: 'AND' | 'OR';
	}> = [];
	constructor() {
		super();
	}

	public and(...query: RawQueryParameter<T>[]) {
		const filteredQuery = filterOutEmptySegments(query);
		if (filteredQuery.length > 0) {
			this.clauses.push({
				join: 'AND',
				clause: new Query(...filteredQuery),
			});
		}

		return this;
	}

	public or(...query: RawQueryParameter<T>[]) {
		const filteredQuery = filterOutEmptySegments(query);
		if (filteredQuery.length > 0) {
			this.clauses.push({
				join: 'OR',
				clause: new Query(...filteredQuery),
			});
		}

		return this;
	}

	public getSegments(): QuerySegment<T>[] {
		const query = new QueryBuilder<T>({ join: ' ' });

		if (this.clauses.length > 0) {
			this.clauses.forEach((clause, index) => {
				query.raw(index > 0 ? clause.join : undefined, clause.clause);
			});
		}

		return query.getSegments();
	}

	public size() {
		return this.clauses.length;
	}
}
