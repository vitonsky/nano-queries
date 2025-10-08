import { format } from 'sql-formatter';

import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { RawSegment } from '../core/RawSegment';
import { BaseValues } from '../types';
import { SQLCompiler } from './SQLCompiler';

test('Compiler can process linear queries', () => {
	const compiler = new SQLCompiler();

	expect(
		compiler.compile(
			new Query(
				new RawSegment('SELECT *'),
				new RawSegment(' '),
				new RawSegment('FROM foo'),
				new RawSegment(' '),
				new RawSegment('WHERE x='),
				new PreparedValue(1),
				new RawSegment(' '),
				new RawSegment('LIMIT'),
				new RawSegment(' '),
				new PreparedValue(2),
				new RawSegment(' '),
				new RawSegment('OFFSET'),
				new RawSegment(' '),
				new PreparedValue(3),
			),
		),
	).toEqual({
		command: 'SELECT * FROM foo WHERE x=? LIMIT ? OFFSET ?',
		bindings: [1, 2, 3],
	});
});

test('Compiler can process nested queries', () => {
	const compiler = new SQLCompiler();

	expect(
		compiler.compile(
			new Query(
				new RawSegment('SELECT *'),
				new RawSegment(' '),
				new RawSegment('FROM foo'),
				new RawSegment(' '),
				new RawSegment('WHERE x='),
				new PreparedValue(1),
				new RawSegment(' AND '),
				new Query<BaseValues>(
					new RawSegment('('),
					new RawSegment('SELECT y FROM bar WHERE n='),
					new PreparedValue('foo'),
					new RawSegment(' OR '),
					new Query(new RawSegment('n2='), new PreparedValue('bar')),
					new RawSegment(')'),
				),
				new RawSegment(' '),
				new RawSegment('LIMIT'),
				new RawSegment(' '),
				new PreparedValue(2),
				new RawSegment(' '),
				new RawSegment('OFFSET'),
				new RawSegment(' '),
				new PreparedValue(3),
			),
		),
	).toEqual({
		command:
			'SELECT * FROM foo WHERE x=? AND (SELECT y FROM bar WHERE n=? OR n2=?) LIMIT ? OFFSET ?',
		bindings: [1, 'foo', 'bar', 2, 3],
	});
});

describe('Compiler options', () => {
	test('Compilation with positional placeholders', () => {
		const compiler = new SQLCompiler({
			getPlaceholder(index) {
				return '$' + (index + 1);
			},
		});

		expect(
			compiler.compile(
				new Query(
					new RawSegment('SELECT *'),
					new RawSegment(' '),
					new RawSegment('FROM foo'),
					new RawSegment(' '),
					new RawSegment('WHERE x='),
					new PreparedValue(1),
					new RawSegment(' AND '),
					new Query<BaseValues>(
						new RawSegment('('),
						new RawSegment('SELECT y FROM bar WHERE n='),
						new PreparedValue('foo'),
						new RawSegment(' OR '),
						new Query(new RawSegment('n2='), new PreparedValue('bar')),
						new RawSegment(')'),
					),
					new RawSegment(' '),
					new RawSegment('LIMIT'),
					new RawSegment(' '),
					new PreparedValue(2),
					new RawSegment(' '),
					new RawSegment('OFFSET'),
					new RawSegment(' '),
					new PreparedValue(3),
				),
			),
		).toEqual({
			command:
				'SELECT * FROM foo WHERE x=$1 AND (SELECT y FROM bar WHERE n=$2 OR n2=$3) LIMIT $4 OFFSET $5',
			bindings: [1, 'foo', 'bar', 2, 3],
		});
	});

	test('Compilation with post processing', () => {
		const compiler = new SQLCompiler({
			getPlaceholder(index) {
				return '$' + (index + 1);
			},
			onPostProcess(code) {
				return format(code, { language: 'postgresql' });
			},
		});

		expect(
			compiler.compile(
				new Query(
					new RawSegment('SELECT *'),
					new RawSegment(' '),
					new RawSegment('FROM foo'),
					new RawSegment(' '),
					new RawSegment('WHERE x='),
					new PreparedValue(1),
					new RawSegment(' AND '),
					new Query<BaseValues>(
						new RawSegment('('),
						new RawSegment('SELECT y FROM bar WHERE n='),
						new PreparedValue('foo'),
						new RawSegment(' OR '),
						new Query(new RawSegment('n2='), new PreparedValue('bar')),
						new RawSegment(')'),
					),
					new RawSegment(' '),
					new RawSegment('ORDER BY embedding <=> [0.1, 0.2, 0.3] ASC'),
					new RawSegment(' '),
					new RawSegment('LIMIT'),
					new RawSegment(' '),
					new PreparedValue(2),
					new RawSegment(' '),
					new RawSegment('OFFSET'),
					new RawSegment(' '),
					new PreparedValue(3),
				),
			),
		).toMatchSnapshot();
	});
});

test('Compiler run hook to transform values', () => {
	type AllowedValues = string | number | boolean;
	const compiler = new SQLCompiler<AllowedValues>({
		transformValue(value) {
			// Convert boolean to numeric, to make code work in SQLite for example
			if (typeof value === 'boolean') return Number(value);
			return value;
		},
	});

	// Flat query
	expect(
		compiler.compile(
			new Query<AllowedValues>(
				new RawSegment('SELECT *'),
				new RawSegment(' '),
				new RawSegment('FROM foo'),
				new RawSegment(' '),
				new RawSegment('WHERE x='),
				new PreparedValue(100_000),
				new RawSegment(' AND is_visible='),
				new PreparedValue(true),
				new RawSegment(' AND is_deleted='),
				new PreparedValue(false),
			),
		),
	).toEqual({
		command: 'SELECT * FROM foo WHERE x=? AND is_visible=? AND is_deleted=?',
		bindings: [100_000, 1, 0],
	});

	// Nested query
	expect(
		compiler.compile(
			new Query<AllowedValues>(
				new RawSegment('SELECT *'),
				new RawSegment(' '),
				new Query<AllowedValues>(
					new RawSegment('FROM foo'),
					new RawSegment(' '),
					new RawSegment('WHERE x='),
					new PreparedValue(100_000),
					new RawSegment(' AND is_visible='),
					new PreparedValue(true),
					new Query<AllowedValues>(
						new RawSegment(' AND is_deleted='),
						new PreparedValue(false),
					),
				),
			),
		),
	).toEqual({
		command: 'SELECT * FROM foo WHERE x=? AND is_visible=? AND is_deleted=?',
		bindings: [100_000, 1, 0],
	});
});
