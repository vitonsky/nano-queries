import { SQLCompiler } from '../compilers/SQLCompiler';
import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { TemplateStringQueryBuilder } from '../TemplateStringQueryBuilder';
import { PrimitiveValue, QueryBindings, RawQueryParameter } from '../types';
import { ConditionClause } from './ConditionClause';
import { GroupExpression } from './GroupExpression';
import { LimitClause } from './LimitClause';
import { SelectStatement, SelectStatementOptions } from './SelectStatement';
import { SetExpression } from './SetExpression';
import { WhereClause } from './WhereClause';

export class ConfigurableSQLBuilder {
	private readonly compiler;
	constructor(compiler: SQLCompiler) {
		this.compiler = compiler;
	}

	public raw = (...segments: RawQueryParameter[]) =>
		new QueryBuilder().raw(...segments);
	public line = (...segments: RawQueryParameter[]) =>
		new QueryBuilder({ join: ' ' }).raw(...segments);
	public group = (...segments: RawQueryParameter[]) => new GroupExpression(...segments);
	public set = (segments: RawQueryParameter[]) => new SetExpression(...segments);
	public value = (value: QueryBindings) => new PreparedValue(value);
	public values = (values: Array<QueryBindings> | Record<string, QueryBindings>) => {
		if (Array.isArray(values)) {
			return new SetExpression(...values.map((value) => new PreparedValue(value)));
		}

		return new SetExpression(
			...Object.entries(values).map(([key, value]) =>
				new QueryBuilder().raw(key, '=').value(value),
			),
		);
	};
	public where = (...segments: RawQueryParameter[]) =>
		new WhereClause().and(...segments);
	public condition = (...segments: RawQueryParameter[]) =>
		new ConditionClause().and(...segments);
	public limit = (limit?: number) => new LimitClause({ limit });
	public offset = (offset?: number) => new LimitClause({ offset });
	public select = (...params: SelectStatementOptions) => new SelectStatement(...params);

	/**
	 * Compile query to SQL string and bindings
	 */
	public toSQL = (query: Query): { sql: string; bindings: QueryBindings[] } => {
		return this.compiler.toSQL(query);
	};

	private readonly templateStringBuilder = new TemplateStringQueryBuilder();
	public sql = (
		strings: TemplateStringsArray,
		...params: Array<PrimitiveValue | Query>
	) => this.templateStringBuilder.build(strings, ...params);
}
