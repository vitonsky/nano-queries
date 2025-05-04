import { SQLCompiler } from './compilers/SQLCompiler';
import { InlineBuilder } from './InlineBuilder';

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
