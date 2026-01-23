<span class="not-content">

[![](https://img.shields.io/npm/v/nano-queries.svg)](https://www.npmjs.com/package/nano-queries) ![](https://github.com/vitonsky/nano-queries/actions/workflows/codeql-analysis.yml/badge.svg)

</span>


State of the art query builder.

Highlights
- Database-agnostic design to build queries for anything, including SQL and NoSQL databases
- Simple API to build a complex queries
- It is really secure. User input are boxed and never mixes with a raw query. Query compiles to a string with placeholders and array with bindings
- Laziness. First class support of a dynamic query building and lateral query extension
- Nested queries
- Easy to extend. Build your own modules from a primitives

# Motivation

At June of 2023 I've found myself in a picante situation. We had use a custom database on some project and I was needed in a simple query builder to build a complex queries dynamically and ensure security against user input injections. I find out there are no solutions of that problem on JavaScript platform at all.

All exists query builders had at least one of fundamental problems below (usually most of them)
- they are built for specific database or a few. They require a "drivers", "compilers", etc that does not exists for our database
- they are designed to be ORM or anything but not just a query builder
- they are work only in node platform, but not in browser, deno, etc

The purpose of a **query builder** is to simplify building of a complex queries and ensure its safety. That's all.

That's exactly what `nano-queries` does. We use this solution in production since 2023 and open sourced it for community.

Nano queries works well with any database - SQLite, Postgres, MySQL, Oracle, GraphQL, PGLite, DuckDB, etc. Actually you may build any queries that may be compiled to a string.

# Usage

All you need is to configure compiler once and compile your queries.

Here is an example with a `SQLCompiler`

```ts
import { ConfigurableSQLBuilder, SQLCompiler } from 'nano-queries';

// SQL builder must be configured once
const { sql, compile } = new ConfigurableSQLBuilder(
	new SQLCompiler({
		getPlaceholder(valueIndex) {
			return '$' + (valueIndex + 1);
		},
	}),
);

const currentYear = new Date().getFullYear();
compile(sql`SELECT title FROM movies WHERE release_year = ${currentYear}`)

// Returns query with placeholders and array with bindings equal to
// {
//   sql: "SELECT title FROM movies WHERE release_year = $1",
//   bindings: [2026],
// }
```

You may build queries dynamically.

In example below a `line()` call creates a query that may be extended via `raw()` call that will add a raw text to a query and adds a space before segments.

```ts
const { sql, compile, line } = new ConfigurableSQLBuilder(/* ... */);

const filter = line();
const query = sql`SELECT title FROM movies ${filter} LIMIT 100`;

// We may extend a query segment any time before compiling
const currentYear = new Date().getFullYear();
filter.raw('WHERE');
filter.raw('release_year =').value(currentYear);

compile(query);
// {
//   sql: 'SELECT title FROM movies WHERE release_year = $1 LIMIT 100',
//   bindings: [currentYear],
// }
```

As you can see, first we add a query `filter` to another query, and then extend a `filter` query.

You may modify a queries anytime before compiling. This is useful when you want to build a query conditionally with optional parts.

# The Design

A `nano-queries` design is based on the idea that only the programmer knows how to implement the ideal query properly, and the query builder must not limit the programmer in doing their work.

That's why the core concept of `nano-queries` is **query segments**.

A query segments is a nodes that represents a raw code and data (user input), and may be compiled to a **query** and **bindings**.

All query segments is based on 3 primitives:

- `RawSegment` represents a raw code in query and will be compiled as is
- `PreparedValue` represents an user input and will be replaced with a placeholder while compiling
- `Query` represents a collection of query segments and may contains another instances of `Query`. Compiler will handle all segments inside `Query` recursively


Additionally, there are `QueryBuilder` that extends `Query` and let you build queries step by step like that

```ts
import { SQLCompiler, QueryBuilder } from 'nano-queries';

const compiler = new SQLCompiler();

compiler.toSQL(
  new QueryBuilder({ join: ' ' })
    .raw('SELECT * FROM notes WHERE id IN')
    .raw(
      new QueryBuilder()
        .raw('(SELECT note_id FROM tags WHERE name=')
        .value('personal')
        .raw(')')
    )
    .raw('LIMIT').value(100)
    .raw('OFFSET').value(200)
);
```

and `TemplateStringQueryBuilder` that let you build query as a templated string

```ts
import { SQLCompiler, TemplateStringQueryBuilder } from 'nano-queries';

const compiler = new SQLCompiler();
const sql = new TemplateStringQueryBuilder();

const userInput = {
  name: "foo",
  limit: 100,
  offset: 200,
};

compiler.toSQL(
  sql.build`
    SELECT * FROM notes
    WHERE id IN (
      SELECT note_id FROM tags WHERE name=${userInput.name}
    )
    LIMIT ${userInput.limit} OFFSET ${userInput.offset}`
);
```

Both examples above yields query object equivalent to
```json
{
  "sql": "SELECT * FROM notes WHERE id IN (SELECT note_id FROM tags WHERE name=?) LIMIT ? OFFSET ?",
  "bindings": ["foo", 100, 200],
}
```

User input in both cases will be replaced to a placeholder and become in a bindings list.

## Database-agnostic design

With `nano-queries` you may **build queries for any database**, including SQLite, Postgres, MariaDB, and even embedded databases implemented on JavaScript or WASM like [PGlite](https://pglite.dev/).

Moreover, you may build not only SQL queries, but any text query and bindings for it. For example, you may build a complex and safe queries for GraphQL, Redis Lua Scripting, SPARQL, gRPC, etc.

That's important feature and reason why `nano-queries` stands out among other solutions.

You may just configure queries compiler, to build queries for your target database dialect, or even implement your own compiler.

```ts
import { SQLCompiler, QueryBuilder } from 'nano-queries';

export const compiler = new SQLCompiler({
  // Optionally, you may configure queries compiler, for your database.
  // In this example we configure placeholders to generate SQL for Postgres
  // By default will be used anonymous placeholders (symbol `?`) that used in SQLite
  getPlaceholder(index) {
    return '$' + (index + 1);
  },
});

compiler.toSQL(
  new QueryBuilder({ join: ' ' })
    .raw('SELECT * FROM notes WHERE id IN')
    .raw(
      new QueryBuilder()
        .raw('(SELECT note_id FROM tags WHERE name=')
        .value('personal')
        .raw(')')
    )
    .raw('LIMIT').value(100)
    .raw('OFFSET').value(200)
);
```

Code above yields query object equal to
```json
{
  "sql": "SELECT * FROM notes WHERE id IN (SELECT note_id FROM tags WHERE name=$1) LIMIT $2 OFFSET $3",
  "bindings": ["foo", 100, 200],
}
```

## Custom query segments

Even though you may build queries step by step via `QueryBuilder` as in examples above, you may also use a custom queries from `nano-queries/sql` or implement your own custom queries.

Custom query segment is a class that extends a basic class `Query` and let you construct complex pieces of queries like SQL expressions, clauses, operators, etc.

Example with implementation of `LimitClause`:

```ts
import { Query, QueryBuilder, IQuery, QuerySegment } from 'nano-queries';

export class LimitClause extends Query implements IQuery {
  private readonly state;
  constructor(state: { limit?: number; offset?: number }) {
    super();
    this.state = state;
  }

  /**
   * This method will be called while query compiling,
   * to get query segments primitives.
   * 
   * Note that `LimitClause` receives and stores only parameters,
   * and never stores a query.
   * 
   * Instead, a query segments creates in this method by compiler call
   */
  public getSegments(): QuerySegment[] {
    const { limit, offset } = this.state;

    const query = new QueryBuilder({ join: ' ' });

    if (limit) {
      query.raw('LIMIT').value(limit);
    }

    if (offset) {
      query.raw('OFFSET').value(offset);
    }

    return query.getSegments();
  }
}
```

Now you may use new query segment `LimitClause` in your queries like that:

```js
import { SQLCompiler, QueryBuilder } from 'nano-queries';

const compiler = new SQLCompiler()

test('Limit and offset appends as placeholders', () => {
  const query = new QueryBuilder({ join: ' ' }).raw(
    'SELECT * FROM foo',
    new LimitClause({ limit: 100, offset: 200 })
  );

  expect(compiler.toSQL(query)).toEqual({
    sql: 'SELECT * FROM foo LIMIT ? OFFSET ?',
    bindings: [100, 200],
  });
});
```

`nano-queries` provides some basic **query segments** for SQL by path `nano-queries/sql`.

The purpose of basic **query segments** is to simplify composing a routine queries.

Implementation of some basic query segments may be not ideal for now or something may be missed. In that case you should implement them itself, but you are welcome to [make issues](https://github.com/vitonsky/nano-queries/issues/new/choose) with requests for new query segments you missing.
