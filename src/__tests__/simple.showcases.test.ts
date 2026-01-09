/* eslint-disable spellcheck/spell-checker */

import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';
import { ConfigurableSQLBuilder } from 'nano-queries/sql/ConfigurableSQLBuilder';
import { expect, test } from 'vitest';

const compiler = new SQLCompiler({
	getPlaceholder(valueIndex) {
		return '$' + (valueIndex + 1);
	},
});

const { sql, line, values } = new ConfigurableSQLBuilder(compiler);

test('Trivial query', async () => {
	const currentYear = new Date().getFullYear();
	expect(
		compiler.toSQL(sql`SELECT title FROM movies WHERE release_year = ${currentYear}`),
	).toEqual({
		sql: 'SELECT title FROM movies WHERE release_year = $1',
		bindings: [currentYear],
	});
});

test('Lateral binding and dynamic extension', async () => {
	const filter = line();
	const query = sql`SELECT title FROM movies ${filter} LIMIT 100`;

	// We may extend a query segment any time before compiling
	const currentYear = new Date().getFullYear();
	filter.raw('WHERE');
	filter.raw('release_year =').value(currentYear);

	expect(compiler.toSQL(query)).toEqual({
		sql: 'SELECT title FROM movies WHERE release_year = $1 LIMIT 100',
		bindings: [currentYear],
	});
});

test('Helpers', async () => {
	const selectedYears = [1995, 2001, 2006];
	expect(
		compiler.toSQL(
			sql`SELECT title FROM movies WHERE release_year IN ${values(selectedYears).withParenthesis()}`,
		),
	).toEqual({
		sql: 'SELECT title FROM movies WHERE release_year IN ($1,$2,$3)',
		bindings: [...selectedYears],
	});
});
