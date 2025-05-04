import { SQLCompiler } from './compilers/SQLCompiler';
import { InlineBuilder } from './InlineBuilder';
import { QueryBuilder } from './QueryBuilder';

const compiler = new SQLCompiler();

test('User input converts to bindings', () => {
	const builder = new InlineBuilder();

	expect(
		compiler.toSQL(builder.build`SELECT * FROM foo WHERE foo=${1} LIMIT 2`),
	).toEqual({
		sql: 'SELECT * FROM foo WHERE foo=? LIMIT 2',
		bindings: [1],
	});

	expect(
		compiler.toSQL(
			builder.build`SELECT * FROM foo WHERE foo=${1} bar=${'hello' + ' ' + 'world'} LIMIT 2`,
		),
	).toEqual({
		sql: 'SELECT * FROM foo WHERE foo=? bar=? LIMIT 2',
		bindings: [1, 'hello world'],
	});
});

test('Implicitly raw queries inserts as is', () => {
	const builder = new InlineBuilder();

	// Insert query built with query builder
	const rawQuery = new QueryBuilder({
		join: null,
	})
		.raw('ORDER BY x * ')
		.value(3.14);

	expect(
		compiler.toSQL(
			builder.build`SELECT * FROM foo WHERE foo=${1} ${rawQuery} LIMIT 2`,
		),
	).toEqual({
		sql: 'SELECT * FROM foo WHERE foo=? ORDER BY x * ? LIMIT 2',
		bindings: [1, 3.14],
	});

	// Insert nested queries
	expect(
		compiler.toSQL(
			builder.build`SELECT * FROM foo WHERE foo=${1} ${builder.build`ORDER BY x * ${3.14}`} LIMIT 2`,
		),
	).toEqual({
		sql: 'SELECT * FROM foo WHERE foo=? ORDER BY x * ? LIMIT 2',
		bindings: [1, 3.14],
	});
});
