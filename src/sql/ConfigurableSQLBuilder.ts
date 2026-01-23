import { SQLCompiler } from '../compilers/SQLCompiler';
import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { TemplateStringQueryBuilder } from '../TemplateStringQueryBuilder';
import { BaseValues, QuerySegment, RawQueryParameter } from '../types';
import { ConditionClause } from './ConditionClause';
import { GroupExpression } from './GroupExpression';
import { LimitClause } from './LimitClause';
import { SelectStatement } from './SelectStatement';
import { SetExpression } from './SetExpression';
import { WhereClause } from './WhereClause';

export class ConfigurableSQLBuilder<T = BaseValues> {
	private readonly compiler;
	constructor(compiler: SQLCompiler<T>) {
		this.compiler = compiler;
	}

	public raw = (...segments: RawQueryParameter<T>[]) =>
		new QueryBuilder<T>().raw(...segments);
	public line = (...segments: RawQueryParameter<T>[]) =>
		new QueryBuilder<T>({ join: ' ' }).raw(...segments);
	public group = (...segments: RawQueryParameter<T>[]) =>
		new GroupExpression<T>(...segments);
	public set = (segments: RawQueryParameter<T>[]) => new SetExpression(...segments);
	public value = (value: T) => new PreparedValue(value);
	public values = (values: Array<T> | Record<string, T>) => {
		if (Array.isArray(values)) {
			return new SetExpression(
				...values.map((value) => new PreparedValue<T>(value)),
			);
		}

		return new SetExpression(
			...Object.entries(values).map(([key, value]) =>
				new QueryBuilder<T>().raw(key, '=').value(value),
			),
		);
	};
	public where = (...segments: RawQueryParameter<T>[]) =>
		new WhereClause<T>().and(...segments);
	public condition = (...segments: RawQueryParameter<T>[]) =>
		new ConditionClause<T>().and(...segments);
	public limit = (limit?: number) => new LimitClause({ limit });
	public offset = (offset?: number) => new LimitClause({ offset });
	public select = (...params: RawQueryParameter<T>[]) => new SelectStatement(...params);

	/**
	 * Compile query to SQL string and bindings
	 */
	public toSQL = (query: Query<T>): { sql: string; bindings: T[] } => {
		return this.compiler.toSQL(query);
	};

	public compile = this.toSQL;

	private readonly templateStringBuilder = new TemplateStringQueryBuilder<T>();
	public sql = (
		strings: TemplateStringsArray,
		...params: Array<T | QuerySegment<T> | undefined>
	) => this.templateStringBuilder.build(strings, ...params);
}
