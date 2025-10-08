import { SQLCompiler } from '../compilers/SQLCompiler';
import { Query } from './Query';

const compiler = new SQLCompiler();

test('Primitive values converts to sql', () => {
	expect(compiler.toSQL(new Query('foo', 'bar', 1, 2, true, false))).toEqual({
		sql: 'foobar12truefalse',
		bindings: [],
	});
});

test('Unexpected values converts to sql', () => {
	const date = new Date();
	expect(
		compiler.toSQL(
			new Query(
				{
					getValue() {
						return date;
					},
				} as any,
				{
					getValue() {
						return {};
					},
				} as any,
				{
					getValue() {
						return null;
					},
				} as any,
			),
		),
	).toEqual({
		sql: date.toString() + '[object Object]' + 'null',
		bindings: [],
	});
});
