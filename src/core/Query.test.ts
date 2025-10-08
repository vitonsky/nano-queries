import { SQLCompiler } from '../compilers/SQLCompiler';
import { PreparedValue } from './PreparedValue';
import { Query } from './Query';

const compiler = new SQLCompiler();

test('Primitive values converts to sql', () => {
	expect(
		compiler.toSQL(new Query('foo', 'bar', 1, 2, true as any, false as any)),
	).toEqual({
		sql: 'foobar12',
		bindings: [],
	});
});

test('Prepared values of any type converts to bindings', () => {
	type Values = string | Date | Symbol;
	const compiler = new SQLCompiler<Values>();
	expect(
		compiler.toSQL(
			new Query<Values>(
				new PreparedValue('hello'),
				new PreparedValue(new Date()),
				new PreparedValue(Symbol()),
			),
		),
	).toEqual({
		sql: '???',
		bindings: ['hello', expect.any(Date), expect.any(Symbol)],
	});
});

test('Unexpected values converts to sql', () => {
	const date = new Date();
	expect(
		compiler.toSQL(
			new Query(
				undefined,
				true as any,
				false as any,
				Symbol() as any,
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
		sql: '',
		bindings: [],
	});
});
