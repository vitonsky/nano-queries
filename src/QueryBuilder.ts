import { PreparedValue } from './core/PreparedValue';
import { Query } from './core/Query';
import { RawSegment } from './core/RawSegment';
import { IQuery, PrimitiveValue, QuerySegment, RawQueryParameter } from './types';
import { isEmptySegment } from './utils/segments';

export type QueryConstructorOptions = {
	join?: string | null;
};

export class QueryBuilder extends Query implements IQuery {
	private readonly options;
	constructor({ join = null }: QueryConstructorOptions = {}) {
		super();

		this.options = { join };
	}

	public raw(...segments: RawQueryParameter[]) {
		this.addSegment(...segments);
		return this;
	}

	public value = (value: PrimitiveValue) => {
		return this.raw(new PreparedValue(value));
	};

	public getSegments() {
		const { join } = this.options;

		const preparedQuery: QuerySegment[] = [];
		this.segments.forEach((segment) => {
			if (isEmptySegment(segment)) return;

			// Add divider between segments
			if (preparedQuery.length > 0 && join !== null) {
				preparedQuery.push(new RawSegment(join));
			}

			preparedQuery.push(segment);
		});

		return preparedQuery;
	}
}
