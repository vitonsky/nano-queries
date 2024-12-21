/* eslint-disable spellcheck/spell-checker */

import { expect, test } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

import { SQLCompiler } from '../compilers/SQLCompiler';
import { PreparedValue } from '../core/PreparedValue';
import { QueryBuilder } from '../QueryBuilder';
import { SelectStatement } from '../sql/SelectStatement';
import { SetExpression } from '../sql/SetExpression';
import { WhereClause } from '../sql/WhereClause';

const compiler = new SQLCompiler({
	getPlaceholder(valueIndex) {
		return '$' + (valueIndex + 1);
	},
});

const db = new PGlite();

const movies: Array<{
	title: string;
	score: number;
}> = [
	{
		title: 'Spider Man',
		score: 6,
	},
	{
		title: 'Spider Man 2',
		score: 5,
	},
	{
		title: 'Lord of Ring',
		score: 8,
	},
	{
		title: 'The Matrix',
		score: 9,
	},
];

test('create table movies', async () => {
	await expect(
		db.query(
			compiler.toSQL(
				new QueryBuilder({ join: ' ' }).raw(`CREATE TABLE movies (
					id uuid DEFAULT gen_random_uuid(),
					title VARCHAR NOT NULL,
					score INT NOT NULL,
					PRIMARY KEY (id)
				);`),
			).sql,
		),
	).resolves.toEqual(
		expect.objectContaining({
			rows: [],
		}),
	);
});

test('fill table movies', async () => {
	const values = new SetExpression();
	movies.forEach((movie) => {
		values.raw(
			new SetExpression().value(movie.title).value(movie.score).withParenthesis(),
		);
	});

	const command = compiler.toSQL(
		new QueryBuilder({ join: ' ' })
			.raw('INSERT INTO movies (title, score)')
			.raw('VALUES', values),
	);

	await expect(db.query(command.sql, command.bindings)).resolves.toEqual(
		expect.objectContaining({
			rows: [],
		}),
	);
});

test('list table movies', async () => {
	const command = compiler.toSQL(new SelectStatement().select('*').from('movies'));

	await expect(db.query(command.sql, command.bindings)).resolves.toEqual(
		expect.objectContaining({
			rows: movies.map((movie) =>
				expect.objectContaining({
					id: expect.any(String),
					title: movie.title,
					score: movie.score,
				}),
			),
		}),
	);
});

test('delete single movie', async () => {
	const command = compiler.toSQL(
		new QueryBuilder({ join: ' ' }).raw(
			'DELETE FROM movies',
			new WhereClause().and('title=', new QueryBuilder().value(movies[0].title)),
		),
	);

	await expect(db.query(command.sql, command.bindings)).resolves.toEqual(
		expect.objectContaining({
			rows: [],
		}),
	);

	const command2 = compiler.toSQL(new SelectStatement().select('*').from('movies'));
	await expect(db.query(command2.sql, command2.bindings)).resolves.toEqual(
		expect.objectContaining({
			rows: movies.slice(1).map((movie) =>
				expect.objectContaining({
					id: expect.any(String),
					title: movie.title,
					score: movie.score,
				}),
			),
		}),
	);
});

test('update single movie', async () => {
	const movieName = movies[1].title;

	const command = compiler.toSQL(
		new QueryBuilder({ join: ' ' }).raw(
			'UPDATE movies SET',
			new SetExpression(new QueryBuilder().raw('score=').value(1)),
			new WhereClause().and('title=', new PreparedValue(movieName)),
		),
	);

	await expect(db.query(command.sql, command.bindings)).resolves.toEqual(
		expect.objectContaining({
			rows: [],
		}),
	);

	const command2 = compiler.toSQL(
		new SelectStatement()
			.select('*')
			.from('movies')
			.where(new QueryBuilder().raw('title=').value(movieName)),
	);
	await expect(db.query(command2.sql, command2.bindings)).resolves.toEqual(
		expect.objectContaining({
			rows: [
				expect.objectContaining({
					id: expect.any(String),
					title: movieName,
					score: 1,
				}),
			],
		}),
	);
});
