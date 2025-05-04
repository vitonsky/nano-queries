import { SQLCompiler } from '../compilers/SQLCompiler';
import { ConfigurableSQLBuilder } from './ConfigurableSQLBuilder';

const qb = new ConfigurableSQLBuilder(new SQLCompiler());

test('Complex query building', () => {
	const query = (sources: (string | number)[]) =>
		qb.line(
			'SELECT * FROM notes',
			qb.where(
				qb
					.condition('workspace_id=', qb.value('fake-uuid'))
					.and(
						sources.length === 0
							? undefined
							: qb
									.line('id IN')
									.raw(
										qb.group(
											qb
												.line('SELECT target FROM attachedTags')
												.raw(
													qb.where(
														qb
															.line('source IN')
															.raw(
																qb
																	.values(sources)
																	.withParenthesis(),
															),
													),
												),
										),
									),
					),
			),
			qb.limit(20),
			qb.offset(10),
		);

	expect(qb.toSQL(query(['foo', 'bar', 123]))).toEqual({
		sql: 'SELECT * FROM notes WHERE workspace_id=? AND id IN (SELECT target FROM attachedTags WHERE source IN (?,?,?)) LIMIT ? OFFSET ?',
		bindings: ['fake-uuid', 'foo', 'bar', 123, 20, 10],
	});

	expect(qb.toSQL(query([]))).toEqual({
		sql: 'SELECT * FROM notes WHERE workspace_id=? LIMIT ? OFFSET ?',
		bindings: ['fake-uuid', 20, 10],
	});
});

test('Complex query building with templated string', () => {
	const query = (sources: (string | number)[]) =>
		qb.line(
			qb.sql`SELECT * FROM notes WHERE workspace_id=${'fake-uuid'}`,
			sources.length === 0
				? undefined
				: qb.sql`AND id IN (SELECT target FROM attachedTags WHERE source IN (${qb.values(sources)}))`,
			qb.sql`LIMIT ${20} OFFSET ${10}`,
		);

	expect(qb.toSQL(query(['foo', 'bar', 123]))).toEqual({
		sql: 'SELECT * FROM notes WHERE workspace_id=? AND id IN (SELECT target FROM attachedTags WHERE source IN (?,?,?)) LIMIT ? OFFSET ?',
		bindings: ['fake-uuid', 'foo', 'bar', 123, 20, 10],
	});

	expect(qb.toSQL(query([]))).toEqual({
		sql: 'SELECT * FROM notes WHERE workspace_id=? LIMIT ? OFFSET ?',
		bindings: ['fake-uuid', 20, 10],
	});
});

test('Empty blocks yields nothing', () => {
	expect(
		qb.toSQL(
			qb.line(
				qb.raw('SELECT * FROM notes'),
				qb.where(undefined),
				qb.limit(20),
				qb.offset(10),
			),
		),
	).toEqual({
		sql: 'SELECT * FROM notes LIMIT ? OFFSET ?',
		bindings: [20, 10],
	});

	expect(
		qb.toSQL(
			qb.line(
				qb.raw(undefined, null),
				qb.condition(undefined),
				qb.group(undefined),
				qb.where(undefined),
				qb.limit(undefined),
				qb.offset(undefined),
			),
		),
	).toEqual({
		sql: '',
		bindings: [],
	});
});
