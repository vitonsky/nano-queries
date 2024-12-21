import { QueryBuilder } from '../QueryBuilder';
import { IQuery, QuerySegment, RawQueryParameter } from '../types';
import { GroupExpression } from './GroupExpression';

export class SetExpression extends QueryBuilder implements IQuery {
	constructor(...segments: RawQueryParameter[]) {
		super({ join: null });

		this.raw(...segments);
	}

	public withParenthesis() {
		return new GroupExpression(this);
	}

	public getSegments(): QuerySegment[] {
		const query = new QueryBuilder();

		super.getSegments().forEach((item, index) => {
			const preparedItem =
				item instanceof SetExpression ? item.withParenthesis() : item;
			query.raw(index > 0 ? ',' : undefined, preparedItem);
		});

		return query.getSegments();
	}
}
