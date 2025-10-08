import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { BaseValues, IQuery, QuerySegment } from '../types';

// This class is requires numbers to be supported
export class LimitClause<T = BaseValues>
	extends Query<T | number>
	implements IQuery<T | number>
{
	private readonly state;
	constructor(state: { limit?: number; offset?: number }) {
		super();
		this.state = state;
	}

	public getSegments(): QuerySegment<T | number>[] {
		const { limit, offset } = this.state;

		const query = new QueryBuilder<T | number>({ join: ' ' });

		if (limit) {
			query.raw('LIMIT').value(limit);
		}

		if (offset) {
			query.raw('OFFSET').value(offset);
		}

		return query.getSegments();
	}
}
