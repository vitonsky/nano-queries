import { PreparedValue } from './core/PreparedValue';
import { Query } from './core/Query';
import { RawSegment } from './core/RawSegment';
import { QueryBuilder } from './QueryBuilder';
import { BaseValues, QuerySegment, RawQueryParameter } from './types';

export class TemplateStringQueryBuilder<T = BaseValues> {
	public build(
		strings: TemplateStringsArray,
		...params: Array<T | QuerySegment<T> | undefined>
	): Query<T> {
		const query = new QueryBuilder<T>();

		strings.forEach((rawCode, index, items) => {
			query.raw(rawCode);

			const lastItemIndex = items.length - 1;
			if (index < lastItemIndex) {
				const parameter = params[index];

				if (
					parameter === undefined ||
					parameter instanceof Query<T> ||
					parameter instanceof RawSegment ||
					parameter instanceof PreparedValue
				) {
					query.raw(parameter as RawQueryParameter<T>);
				} else {
					query.value(parameter);
				}
			}
		});

		return query;
	}
}
