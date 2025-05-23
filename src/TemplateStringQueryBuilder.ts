import { Query } from './core/Query';
import { QueryBuilder } from './QueryBuilder';
import { PrimitiveValue } from './types';

export class TemplateStringQueryBuilder {
	public build(
		strings: TemplateStringsArray,
		...params: Array<PrimitiveValue | Query>
	): Query {
		const query = new QueryBuilder();

		strings.forEach((rawCode, index, items) => {
			query.raw(rawCode);

			const lastItemIndex = items.length - 1;
			if (index < lastItemIndex) {
				const parameter = params[index];

				if (parameter instanceof Query) {
					query.raw(parameter);
				} else {
					query.value(parameter);
				}
			}
		});

		return query;
	}
}
