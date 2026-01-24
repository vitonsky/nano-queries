import { ConfigurableSQLBuilder, SQLCompiler } from 'nano-queries';
import { expect, test } from 'vitest';

const { sql, values, compile, where } = new ConfigurableSQLBuilder(
	new SQLCompiler({
		getPlaceholder(valueIndex) {
			return '$' + (valueIndex + 1);
		},
	}),
);

test('Trivial query', async () => {
	const currentYear = new Date().getFullYear();
	expect(
		compile(sql`SELECT title FROM movies WHERE release_year = ${currentYear}`),
	).toEqual({
		sql: 'SELECT title FROM movies WHERE release_year = $1',
		bindings: [currentYear],
	});
});

test('Lateral binding and dynamic extension', async () => {
	const userInput = {
		year: new Date().getFullYear(),
		rating: 4.1,
	};

	// You may nest one query into another
	const filter = where();
	const query = sql`SELECT title FROM movies ${filter} LIMIT 100`;

	// A query segment can be extended any time before compiling
	filter.and(sql`release_year = ${userInput.year}`);

	// That's useful to build a complex conditional queries
	if ('rating' in userInput) {
		filter.and(sql`rating >= ${userInput.rating}`);
	}

	expect(compile(query)).toEqual({
		sql: 'SELECT title FROM movies WHERE release_year = $1 AND rating >= $2 LIMIT 100',
		bindings: [userInput.year, userInput.rating],
	});
});

test('Helpers', async () => {
	const selectedYears = [1995, 2001, 2006];
	expect(
		compile(
			sql`SELECT title FROM movies WHERE release_year IN ${values(selectedYears).withParenthesis()}`,
		),
	).toEqual({
		sql: 'SELECT title FROM movies WHERE release_year IN ($1,$2,$3)',
		bindings: [...selectedYears],
	});
});
