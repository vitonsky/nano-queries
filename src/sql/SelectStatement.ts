import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { BaseValues, IQuery, QuerySegment, RawQueryParameter } from '../types';
import { LimitClause } from './LimitClause';
import { SetExpression } from './SetExpression';
import { WhereClause } from './WhereClause';

export class SelectStatement<T = BaseValues>
	extends Query<T | number>
	implements IQuery<T | number>
{
	private readonly _select: RawQueryParameter<T>[];
	private readonly _from: RawQueryParameter<T>[];
	private readonly _limit: { limit?: number; offset?: number };
	private readonly _where;

	constructor(...select: RawQueryParameter<T>[]) {
		super();

		this._select = select;
		this._from = [];
		this._limit = {};

		this._where = new WhereClause<T>();
	}

	public select(...params: RawQueryParameter<T>[]) {
		this._select.push(...params);
		return this;
	}

	public from(...params: RawQueryParameter<T>[]) {
		this._from.push(...params);
		return this;
	}

	public offset(offset?: number) {
		this._limit.offset = offset;
		return this;
	}

	public limit(limit?: number) {
		this._limit.limit = limit;
		return this;
	}

	public where(param: RawQueryParameter<T>, condition: 'and' | 'or' = 'and') {
		this._where[condition](param);
		return this;
	}

	public getSegments(): QuerySegment<T | number>[] {
		const query = new QueryBuilder<T | number>({ join: ' ' });

		query.raw('SELECT');

		if (this._select.length > 0) {
			query.raw(new SetExpression(...this._select));
		} else {
			query.raw('*');
		}

		if (this._from.length === 0) throw TypeError('Not set FROM clause');
		query.raw('FROM', ...this._from);

		query.raw(this._where);

		query.raw(new LimitClause<T>(this._limit));

		return query.getSegments();
	}
}
