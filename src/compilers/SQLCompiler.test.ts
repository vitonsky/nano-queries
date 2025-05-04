import { format } from 'sql-formatter';

import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { RawSegment } from '../core/RawSegment';
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
				new Query(
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
					new Query(
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
					new Query(
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
