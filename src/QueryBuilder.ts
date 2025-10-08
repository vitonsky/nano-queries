import { PreparedValue } from './core/PreparedValue';
import { Query } from './core/Query';
import { RawSegment } from './core/RawSegment';
import { BaseValues, IQuery, QuerySegment, RawQueryParameter } from './types';
import { isEmptySegment } from './utils/segments';

export type QueryConstructorOptions = {
	join?: string | null;
};

export class QueryBuilder<T = BaseValues> extends Query<T> implements IQuery<T> {
	private readonly options;
	constructor({ join = null }: QueryConstructorOptions = {}) {
		super();

		this.options = { join };
	}

	public raw(...segments: RawQueryParameter<T>[]) {
		this.addSegment(...segments);
		return this;
	}

	public value = (value: T) => {
		return this.raw(new PreparedValue(value));
	};

	public getSegments() {
		const { join } = this.options;

		const preparedQuery: QuerySegment<T>[] = [];
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
