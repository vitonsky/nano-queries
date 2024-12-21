[![](https://img.shields.io/npm/v/nano-queries.svg)](https://www.npmjs.com/package/nano-queries) ![](https://github.com/vitonsky/nano-queries/actions/workflows/codeql-analysis.yml/badge.svg)

Simple and powerful query builder for any database.


# About

The purpose of **query builder** is to simplify building a complex (SQL) query for database in safe manner.

The project goals and key features is:
- Simple API to build a complex queries
- A safety of queries, to prevent SQL injections
- Universal and extensible design to build SQL queries for any database

A `nano-queries` is focused to be an ideal **query builder**, that's all. There's no a queries executor, data mapper (Active Record or something), ORM, etc.

Project design is follows the [UNIX philosophy](https://en.wikipedia.org/wiki/Unix_philosophy), that's why this solution works well with any database - SQLite, Postgres, MySQL, Oracle, etc.

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
import { QueryBuilder } from 'nano-queries/QueryBuilder';
import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';

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

Code above yields query object equal to
```json
{
  "sql": "SELECT * FROM notes WHERE id IN (SELECT note_id FROM tags WHERE name=?) LIMIT ? OFFSET ?",
  "bindings": ["foo", 100, 200],
}
```

## Example

With those primitives you may implement custom **query segments** with any API, then compose and compile it to a **query** and **bindings**.

Example with implementation of `nano-queries/sql/LimitClause`:

```ts
import { Query } from 'nano-queries/core/Query';
import { QueryBuilder } from 'nano-queries/QueryBuilder';
import { IQuery, QuerySegment } from 'nano-queries/types';

export class LimitClause extends Query implements IQuery {
  private readonly state;
  constructor(state: { limit?: number; offset?: number }) {
    super();
    this.state = state;
  }

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

Now you may use custom **query segment** in your queries like that:

```js
import { QueryBuilder } from 'nano-queries/QueryBuilder';
import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';

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

# Usage

`nano-queries` provides some basic **query segments** for SQL by path `nano-queries/sql`.

The purpose of basic **query segments** is to simplify composing a routine queries.

Implementation of some basic query segments may be not ideal for now or something may be missed. In that case you should implement them itself, but you are welcome to [make issues](https://github.com/vitonsky/nano-queries/issues/new/choose) with requests for new query segments you missing.

`nano-queries` also provides a configurable query builder, that provides methods to make query segments:

```js
import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';
import { ConfigurableSQLBuilder } from 'nano-queries/sql/ConfigurableSQLBuilder';

// You may configure query builder for you database  once as singleton,
// then export it and use everywhere in your application
export const qb = new ConfigurableSQLBuilder(new SQLCompiler({
  // Optionally, you may configure queries compiler, for your database.
  // In this example we configure placeholders to generate SQL for Postgres
  // By default will be used anonymous placeholders (symbol `?`) that used in SQLite
  getPlaceholder(index) {
    return '$' + (index + 1);
  },
}));

// Now you may build query
qb.toSQL(
  qb.line(
    // You may insert strings with no wrap it to `qb.raw`, they will be converted to raw segments
    qb.raw('SELECT * FROM notes'),
    qb.where(
      qb.condition(
        qb.raw('workspace_id=')
          // That's important to insert user input only with `value` method,
          // to insert placeholder while compiling query
          .value('2ecdc7e5-734e-47a9-b053-f399eb225d7b')
      )
        .and(
            qb.line('id IN').raw(
              qb.group(
                qb
                  .line('SELECT target FROM attachedTags')
                  .raw(
                    qb.where(
                      qb
                        .line('source IN')
                        .raw(
                          qb
                            .values(['foo', 'bar', 123])
                            .withParenthesis(),
                        ),
                    ),
                  ),
              ),
            )
        ),
    ),
    qb.limit(20),
    qb.offset(10),
  )
);

// Code above yields code equal to
// {
//   sql: 'SELECT * FROM notes WHERE workspace_id=$1 AND id IN (SELECT target FROM attachedTags WHERE source IN ($2,$3,$4)) LIMIT $5 OFFSET $6',
//   bindings: ['2ecdc7e5-734e-47a9-b053-f399eb225d7b', 'foo', 'bar', 123, 20, 10],
// }
```

Just like use query builder object you may manually build queries with **query segments** that is classes which may be composed and nested.

```js
import { QueryBuilder } from 'nano-queries/QueryBuilder';
import { PreparedValue } from 'nano-queries/core/PreparedValue';
import { SQLCompiler } from 'nano-queries/compilers/SQLCompiler';

import { ConditionClause } from 'nano-queries/sql/ConditionClause';
import { GroupExpression } from 'nano-queries/sql/GroupExpression';
import { WhereClause } from 'nano-queries/sql/WhereClause';

const compiler = new SQLCompiler()

test('Where clause may be filled after join', () => {
  const where = new WhereClause();
  const query = new QueryBuilder({ join: ' ' }).raw('SELECT * FROM foo', where);

  // You can fill a `where` after build a query object
  where
    .and('x > ', new PreparedValue(0))
    .or(
      new GroupExpression(
        new ConditionClause()
          .and('y=', new PreparedValue(1))
          .and('z=', new PreparedValue(2)),
      ),
    );

  expect(compiler.toSQL(query)).toEqual({
    sql: 'SELECT * FROM foo WHERE x > ? OR (y=? AND z=?)',
    bindings: [0, 1, 2],
  });
});
```

# API

TODO: add docs

# Development

`nano-queries` is an truth open source project, so you are welcome on [project github repository](https://github.com/vitonsky/nano-queries/) to contribute a code, [make issues](https://github.com/vitonsky/nano-queries/issues/new/choose) with feature requests and bug reports.

You may contribute to a project if you tell about `nano-queries` to your friends. Let's hit by garbage ORMs and monstrous "query builders" together.