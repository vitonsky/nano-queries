import { Query } from './core/Query';
import { QueryBuilder } from './QueryBuilder';

export class InlineBuilder {
	public build(
		strings: TemplateStringsArray,
		...params: Array<string | number>
	): Query {
		const query = new QueryBuilder();

		strings.forEach((rawCode, index, items) => {
			query.raw(rawCode);

			const lastItemIndex = items.length - 1;
			if (index < lastItemIndex) {
				const parameter = params[index];
				query.value(parameter);
			}
		});

		return query;
	}
}
