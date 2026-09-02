import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";

type SnapshotColumn = {
  name: string;
  type: string;
  primaryKey: boolean;
  notNull: boolean;
  default?: string | number | boolean;
};

type SnapshotIndex = {
  name: string;
  columns: Array<{
    expression: string;
    isExpression: boolean;
    asc: boolean;
    nulls: "first" | "last";
  }>;
  isUnique: boolean;
  nullsNotDistinct?: boolean;
  method: string;
  where?: string;
  with?: Record<string, string | number>;
};

type SnapshotTable = {
  name: string;
  schema: string;
  columns: Record<string, SnapshotColumn>;
  indexes: Record<string, SnapshotIndex>;
  foreignKeys: Record<string, {
    name: string;
    columnsFrom: string[];
    tableTo: string;
    schemaTo?: string;
    columnsTo: string[];
    onUpdate?: string;
    onDelete?: string;
  }>;
  compositePrimaryKeys: Record<string, { name: string; columns: string[] }>;
  uniqueConstraints: Record<string, {
    name: string;
    columns: string[];
    nullsNotDistinct?: boolean;
  }>;
  checkConstraints: Record<string, { name: string; value: string }>;
};

type SnapshotEnum = {
  name: string;
  schema: string;
  values: string[];
};

type Snapshot = {
  tables: Record<string, SnapshotTable>;
  enums: Record<string, SnapshotEnum>;
};

export type SchemaContract = {
  tables: string[];
  sequences: string[];
  sequenceBindings: string[];
  routines: string[];
  columns: string[];
  indexes: string[];
  indexDefinitions: string[];
  constraints: string[];
  constraintDefinitions: string[];
  enums: string[];
};

export async function loadSchemaContract(): Promise<SchemaContract> {
  const metaDirectory = join(process.cwd(), "drizzle", "migrations", "meta");
  const snapshots = (await readdir(metaDirectory))
    .filter((name) => /^\d+_snapshot\.json$/.test(name))
    .sort();
  const latest = snapshots.at(-1);
  if (!latest) throw new Error("No active Drizzle schema snapshot was found");

  const snapshot = JSON.parse(
    await readFile(join(metaDirectory, latest), "utf8"),
  ) as Snapshot;
  const tables = Object.values(snapshot.tables)
    .filter((table) => table.schema === "app_private")
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    tables: tables.map((table) => table.name),
    sequences: tables
      .flatMap((table) =>
        Object.values(table.columns)
          .filter((column) => /^(?:big)?serial$/i.test(column.type))
          .map((column) => `${table.name}_${column.name}_seq`),
      )
      .sort(),
    sequenceBindings: tables
      .flatMap((table) =>
        Object.values(table.columns)
          .filter((column) => /^(?:big)?serial$/i.test(column.type))
          .map((column) =>
            `${table.name}.${column.name}->${table.name}_${column.name}_seq`
          ),
      )
      .sort(),
    routines: ["app_private.bind_checkout_intent(text,text,text)"],
    columns: tables
      .flatMap((table) =>
        Object.values(table.columns).map((column) =>
          canonicalColumn(
            table.name,
            column.name,
            normalizeType(column.type),
            column.notNull,
            expectedDefault(table.name, column.name, column),
          ),
        ),
      )
      .sort(),
    indexes: tables.flatMap((table) => Object.keys(table.indexes)).sort(),
    indexDefinitions: tables
      .flatMap(snapshotIndexDefinitions)
      .sort(),
    constraints: tables
      .flatMap((table) => {
        const primaryKeys = Object.values(table.columns).some(
          (column) => column.primaryKey,
        )
          ? [`${table.name}_pkey`]
          : [];
        return [
          ...primaryKeys,
          ...Object.keys(table.compositePrimaryKeys),
          ...Object.keys(table.uniqueConstraints),
          ...Object.keys(table.foreignKeys),
          ...Object.keys(table.checkConstraints),
        ];
      })
      .sort(),
    constraintDefinitions: tables
      .flatMap(snapshotConstraintDefinitions)
      .sort(),
    enums: Object.values(snapshot.enums)
      .filter((value) => value.schema === "app_private")
      .map((value) => `${value.name}:${value.values.join(",")}`)
      .sort(),
  };
}

export async function inspectDatabaseStructure(
  sql: ReturnType<typeof postgres>,
): Promise<SchemaContract> {
  const [nullSemanticsCatalog] = await sql.unsafe(`
    select exists (
      select 1
      from pg_attribute
      where attrelid = 'pg_catalog.pg_index'::regclass
        and attname = 'indnullsnotdistinct'
        and not attisdropped
    ) as supported
  `);
  if (nullSemanticsCatalog?.supported !== true) {
    throw new Error(
      "Structural schema verification requires PostgreSQL 15+ catalog support for pg_index.indnullsnotdistinct",
    );
  }

  const tables = await sql.unsafe(`
    select tablename from pg_tables
    where schemaname = 'app_private'
    order by tablename
  `);
  const sequences = await sql.unsafe(`
    select class_row.relname as sequence_name
    from pg_class class_row
    join pg_namespace namespace_row on namespace_row.oid = class_row.relnamespace
    where namespace_row.nspname = 'app_private'
      and class_row.relkind = 'S'
    order by class_row.relname
  `);
  const sequenceBindings = await sql.unsafe(`
    select table_row.relname as table_name,
           attribute.attname as column_name,
           sequence_row.relname as sequence_name
    from pg_class sequence_row
    join pg_namespace namespace_row on namespace_row.oid = sequence_row.relnamespace
    join pg_depend dependency
      on dependency.classid = 'pg_class'::regclass
      and dependency.objid = sequence_row.oid
      and dependency.refclassid = 'pg_class'::regclass
      and dependency.deptype in ('a', 'i')
    join pg_class table_row on table_row.oid = dependency.refobjid
    join pg_attribute attribute
      on attribute.attrelid = table_row.oid
      and attribute.attnum = dependency.refobjsubid
    where namespace_row.nspname = 'app_private'
      and sequence_row.relkind = 'S'
    order by table_row.relname, attribute.attname, sequence_row.relname
  `);
  const routines = await sql.unsafe(`
    select routine.oid::regprocedure::text as signature
    from pg_proc routine
    join pg_namespace namespace_row on namespace_row.oid = routine.pronamespace
    where namespace_row.nspname = 'app_private'
    order by signature
  `);
  const columns = await sql.unsafe(`
    select c.relname as table_name,
           a.attname as column_name,
           replace(format_type(a.atttypid, a.atttypmod), 'app_private.', '') as data_type,
           a.attnotnull as not_null,
           pg_get_expr(defaults.adbin, defaults.adrelid) as default_value
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef defaults
      on defaults.adrelid = a.attrelid and defaults.adnum = a.attnum
    where n.nspname = 'app_private'
      and c.relkind = 'r'
      and a.attnum > 0
      and not a.attisdropped
    order by c.relname, a.attnum
  `);
  const indexes = await sql.unsafe(`
    select index_row.relname as index_name,
           table_row.relname as table_name,
           access_method.amname as method,
           metadata.indisunique as is_unique,
           metadata.indnullsnotdistinct as nulls_not_distinct,
           metadata.indisvalid as is_valid,
           metadata.indnatts > metadata.indnkeyatts as has_included_columns,
           pg_get_expr(metadata.indpred, metadata.indrelid, true) as predicate,
           coalesce(index_row.reloptions, array[]::text[]) as options,
           coalesce(
             jsonb_agg(
               jsonb_build_object(
                 'expression', case
                   when key_row.attnum = 0
                     then pg_get_indexdef(metadata.indexrelid, key_row.ordinality::integer, true)
                   else attribute_row.attname
                 end,
                 'isExpression', key_row.attnum = 0,
                 'asc', (metadata.indoption[key_row.ordinality - 1] & 1) = 0,
                 'nulls', case
                   when (metadata.indoption[key_row.ordinality - 1] & 2) = 2
                     then 'first'
                   else 'last'
                 end,
                 'defaultOpclass', opclass_row.opcdefault,
                 'defaultCollation', metadata.indcollation[key_row.ordinality - 1]
                   = coalesce(attribute_row.attcollation, 0)
               ) order by key_row.ordinality
             ) filter (where key_row.ordinality <= metadata.indnkeyatts),
             '[]'::jsonb
           ) as columns
    from pg_index metadata
    join pg_class index_row on index_row.oid = metadata.indexrelid
    join pg_namespace namespace_row on namespace_row.oid = index_row.relnamespace
    join pg_class table_row on table_row.oid = metadata.indrelid
    join pg_am access_method on access_method.oid = index_row.relam
    left join lateral unnest(metadata.indkey) with ordinality
      as key_row(attnum, ordinality) on true
    left join pg_attribute attribute_row
      on attribute_row.attrelid = metadata.indrelid
      and attribute_row.attnum = key_row.attnum
    left join pg_opclass opclass_row
      on opclass_row.oid = metadata.indclass[key_row.ordinality - 1]
    where namespace_row.nspname = 'app_private'
      and not exists (
        select 1
        from pg_constraint backing_constraint
        where backing_constraint.conindid = metadata.indexrelid
      )
    group by index_row.oid, table_row.relname, access_method.amname,
             metadata.indisunique, metadata.indnullsnotdistinct,
             metadata.indisvalid,
             metadata.indnatts, metadata.indnkeyatts,
             metadata.indpred, metadata.indrelid
    order by index_row.relname
  `);
  const constraints = await sql.unsafe(`
    select constraint_row.conname as constraint_name,
           table_row.relname as table_name,
           constraint_row.contype as constraint_type,
           coalesce((
             select array_agg(attribute_row.attname order by key_row.ordinality)
             from unnest(constraint_row.conkey) with ordinality
               as key_row(attnum, ordinality)
             join pg_attribute attribute_row
               on attribute_row.attrelid = constraint_row.conrelid
               and attribute_row.attnum = key_row.attnum
           ), array[]::text[]) as columns,
           referenced_namespace.nspname as referenced_schema,
           referenced_table.relname as referenced_table,
           coalesce((
             select array_agg(attribute_row.attname order by key_row.ordinality)
             from unnest(constraint_row.confkey) with ordinality
               as key_row(attnum, ordinality)
             join pg_attribute attribute_row
               on attribute_row.attrelid = constraint_row.confrelid
               and attribute_row.attnum = key_row.attnum
           ), array[]::text[]) as referenced_columns,
           constraint_row.confupdtype as update_action,
           constraint_row.confdeltype as delete_action,
           constraint_row.convalidated as validated,
           constraint_row.condeferrable as deferrable,
           constraint_row.condeferred as initially_deferred,
           backing_index.indnullsnotdistinct as nulls_not_distinct,
           pg_get_expr(
             constraint_row.conbin,
             constraint_row.conrelid,
             true
           ) as check_expression
    from pg_constraint constraint_row
    join pg_class table_row on table_row.oid = constraint_row.conrelid
    join pg_namespace namespace_row on namespace_row.oid = table_row.relnamespace
    left join pg_index backing_index
      on backing_index.indexrelid = constraint_row.conindid
    left join pg_class referenced_table
      on referenced_table.oid = constraint_row.confrelid
    left join pg_namespace referenced_namespace
      on referenced_namespace.oid = referenced_table.relnamespace
    where namespace_row.nspname = 'app_private'
      and constraint_row.contype in ('p', 'u', 'f', 'c')
    order by constraint_row.conname
  `);
  const enumRows = await sql.unsafe(`
    select t.typname, e.enumlabel
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    join pg_enum e on e.enumtypid = t.oid
    where n.nspname = 'app_private'
    order by t.typname, e.enumsortorder
  `);
  const enumValues = new Map<string, string[]>();
  for (const row of enumRows) {
    const name = String(row.typname);
    const values = enumValues.get(name) ?? [];
    values.push(String(row.enumlabel));
    enumValues.set(name, values);
  }

  return {
    tables: tables.map((row) => String(row.tablename)),
    sequences: sequences.map((row) => String(row.sequence_name)),
    sequenceBindings: sequenceBindings.map((row) =>
      `${row.table_name}.${row.column_name}->${row.sequence_name}`
    ),
    routines: routines.map((row) => String(row.signature)),
    columns: columns
      .map((row) =>
        canonicalColumn(
          String(row.table_name),
          String(row.column_name),
          normalizeType(String(row.data_type)),
          Boolean(row.not_null),
          actualDefault(row.default_value),
        ),
      )
      .sort(),
    indexes: indexes.map((row) => String(row.index_name)).sort(),
    indexDefinitions: indexes
      .map((row) => canonicalIndexDefinition({
        name: String(row.index_name),
        table: String(row.table_name),
        method: String(row.method),
        unique: Boolean(row.is_unique),
        nullsNotDistinct: Boolean(row.nulls_not_distinct),
        valid: Boolean(row.is_valid),
        hasIncludedColumns: Boolean(row.has_included_columns),
        columns: row.columns as SnapshotIndex["columns"],
        predicate: row.predicate === null
          ? null
          : canonicalizeCheckExpression(String(row.predicate)),
        options: (row.options as string[]).slice().sort(),
      }))
      .sort(),
    constraints: constraints
      .map((row) => String(row.constraint_name))
      .sort(),
    constraintDefinitions: constraints
      .map((row) => actualConstraintDefinition(row))
      .sort(),
    enums: Array.from(enumValues, ([name, values]) =>
      `${name}:${values.join(",")}`,
    ).sort(),
  };
}

export function compareSchemaContract(
  expected: SchemaContract,
  actual: SchemaContract,
): string[] {
  const failures: string[] = [];
  for (const key of [
    "tables",
    "sequences",
    "sequenceBindings",
    "routines",
    "columns",
    "indexes",
    "indexDefinitions",
    "constraints",
    "constraintDefinitions",
    "enums",
  ] as const) {
    const actualValues = actual[key] ?? [];
    const expectedValues = expected[key] ?? [];
    if (JSON.stringify(actualValues) !== JSON.stringify(expectedValues)) {
      failures.push(
        `${key} differ (expected=${expectedValues.join("|")}; actual=${actualValues.join("|")})`,
      );
    }
  }
  return failures;
}

function snapshotIndexDefinitions(table: SnapshotTable) {
  return Object.values(table.indexes).map((index) =>
    canonicalIndexDefinition({
      name: index.name,
      table: table.name,
      method: index.method,
      unique: index.isUnique,
      nullsNotDistinct: index.nullsNotDistinct ?? false,
      valid: true,
      hasIncludedColumns: false,
      columns: index.columns.map((column) => ({
        ...column,
        defaultOpclass: true,
        defaultCollation: true,
      })),
      predicate: index.where
        ? canonicalizeCheckExpression(index.where)
        : null,
      options: Object.entries(index.with ?? {})
        .map(([name, value]) => `${name}=${value}`)
        .sort(),
    })
  );
}

function snapshotConstraintDefinitions(table: SnapshotTable) {
  const definitions: string[] = [];
  const primaryKeyColumns = Object.values(table.columns)
    .filter((column) => column.primaryKey)
    .map((column) => column.name);
  if (primaryKeyColumns.length) {
    definitions.push(canonicalConstraintDefinition({
      name: `${table.name}_pkey`,
      table: table.name,
      kind: "primaryKey",
      columns: primaryKeyColumns,
    }));
  }
  for (const constraint of Object.values(table.compositePrimaryKeys)) {
    definitions.push(canonicalConstraintDefinition({
      name: constraint.name,
      table: table.name,
      kind: "primaryKey",
      columns: constraint.columns,
    }));
  }
  for (const constraint of Object.values(table.uniqueConstraints)) {
    definitions.push(canonicalConstraintDefinition({
      name: constraint.name,
      table: table.name,
      kind: "unique",
      columns: constraint.columns,
      nullsNotDistinct: constraint.nullsNotDistinct ?? false,
    }));
  }
  for (const constraint of Object.values(table.foreignKeys)) {
    definitions.push(canonicalConstraintDefinition({
      name: constraint.name,
      table: table.name,
      kind: "foreignKey",
      columns: constraint.columnsFrom,
      referencedSchema: constraint.schemaTo ?? "app_private",
      referencedTable: constraint.tableTo,
      referencedColumns: constraint.columnsTo,
      onUpdate: canonicalReferentialAction(constraint.onUpdate),
      onDelete: canonicalReferentialAction(constraint.onDelete),
    }));
  }
  for (const constraint of Object.values(table.checkConstraints)) {
    definitions.push(canonicalConstraintDefinition({
      name: constraint.name,
      table: table.name,
      kind: "check",
      expression: canonicalizeCheckExpression(constraint.value),
    }));
  }
  return definitions;
}

type CanonicalConstraint = {
  name: string;
  table: string;
  kind: "primaryKey" | "unique" | "foreignKey" | "check";
  columns?: string[];
  referencedSchema?: string;
  referencedTable?: string;
  referencedColumns?: string[];
  onUpdate?: string;
  onDelete?: string;
  expression?: string;
  nullsNotDistinct?: boolean;
  validated?: boolean;
  deferrable?: boolean;
  initiallyDeferred?: boolean;
};

function canonicalConstraintDefinition(definition: CanonicalConstraint) {
  return `${definition.name}:${JSON.stringify({
    name: definition.name,
    table: definition.table,
    kind: definition.kind,
    columns: definition.columns,
    referencedSchema: definition.referencedSchema,
    referencedTable: definition.referencedTable,
    referencedColumns: definition.referencedColumns,
    onUpdate: definition.onUpdate,
    onDelete: definition.onDelete,
    expression: definition.expression,
    nullsNotDistinct: definition.kind === "unique"
      ? definition.nullsNotDistinct ?? false
      : undefined,
    validated: definition.validated ?? true,
    deferrable: definition.deferrable ?? false,
    initiallyDeferred: definition.initiallyDeferred ?? false,
  })}`;
}

function actualConstraintDefinition(row: Record<string, unknown>) {
  const type = String(row.constraint_type);
  const base = {
    name: String(row.constraint_name),
    table: String(row.table_name),
    validated: Boolean(row.validated),
    deferrable: Boolean(row.deferrable),
    initiallyDeferred: Boolean(row.initially_deferred),
  };
  if (type === "p" || type === "u") {
    return canonicalConstraintDefinition({
      ...base,
      kind: type === "p" ? "primaryKey" : "unique",
      columns: row.columns as string[],
      nullsNotDistinct: type === "u"
        ? Boolean(row.nulls_not_distinct)
        : undefined,
    });
  }
  if (type === "f") {
    return canonicalConstraintDefinition({
      ...base,
      kind: "foreignKey",
      columns: row.columns as string[],
      referencedSchema: String(row.referenced_schema),
      referencedTable: String(row.referenced_table),
      referencedColumns: row.referenced_columns as string[],
      onUpdate: canonicalReferentialAction(String(row.update_action)),
      onDelete: canonicalReferentialAction(String(row.delete_action)),
    });
  }
  return canonicalConstraintDefinition({
    ...base,
    kind: "check",
    expression: canonicalizeCheckExpression(String(row.check_expression)),
  });
}

function canonicalReferentialAction(action?: string) {
  const actions: Record<string, string> = {
    a: "no action",
    r: "restrict",
    c: "cascade",
    n: "set null",
    d: "set default",
  };
  return actions[action ?? ""] ?? (action ?? "no action").toLowerCase();
}

type CanonicalIndexColumn = SnapshotIndex["columns"][number] & {
  defaultOpclass?: boolean;
  defaultCollation?: boolean;
};

function canonicalIndexDefinition(input: {
  name: string;
  table: string;
  method: string;
  unique: boolean;
  nullsNotDistinct: boolean;
  valid: boolean;
  hasIncludedColumns: boolean;
  columns: CanonicalIndexColumn[];
  predicate: string | null;
  options: string[];
}) {
  return `${input.name}:${JSON.stringify({
    table: input.table,
    method: input.method.toLowerCase(),
    unique: input.unique,
    nullsNotDistinct: input.unique ? input.nullsNotDistinct : undefined,
    valid: input.valid,
    hasIncludedColumns: input.hasIncludedColumns,
    columns: input.columns.map((column) => ({
      expression: column.isExpression
        ? canonicalizeCheckExpression(column.expression)
        : canonicalIdentifier(column.expression),
      isExpression: column.isExpression,
      asc: column.asc,
      nulls: column.nulls,
      defaultOpclass: column.defaultOpclass ?? true,
      defaultCollation: column.defaultCollation ?? true,
    })),
    predicate: input.predicate,
    options: input.options,
  })}`;
}

function canonicalIdentifier(value: string) {
  return value.replace(/"/g, "").split(".").at(-1)?.toLowerCase() ?? value;
}

type ExpressionNode =
  | { kind: "identifier"; name: string }
  | { kind: "literal"; value: string | number | boolean | null }
  | { kind: "call"; name: string; arguments: ExpressionNode[] }
  | { kind: "array"; values: ExpressionNode[] }
  | { kind: "operation"; operator: string; operands: ExpressionNode[] };

type ExpressionToken = {
  kind: "identifier" | "number" | "string" | "operator" | "punctuation";
  value: string;
};

export function canonicalizeCheckExpression(value: string) {
  const parser = new SqlExpressionParser(tokenizeSqlExpression(value));
  const expression = parser.parse();
  return JSON.stringify(expression);
}

class SqlExpressionParser {
  private position = 0;

  private readonly tokens: ExpressionToken[];

  constructor(tokens: ExpressionToken[]) {
    this.tokens = tokens;
  }

  parse() {
    const expression = this.parseOr();
    if (this.peek()) {
      throw new Error(`Unsupported SQL expression near ${this.peek()?.value}`);
    }
    return expression;
  }

  private parseOr(): ExpressionNode {
    let expression = this.parseAnd();
    while (this.matchIdentifier("or")) {
      expression = operation("or", [expression, this.parseAnd()]);
    }
    return expression;
  }

  private parseAnd(): ExpressionNode {
    let expression = this.parseNot();
    while (this.matchIdentifier("and")) {
      expression = operation("and", [expression, this.parseNot()]);
    }
    return expression;
  }

  private parseNot(): ExpressionNode {
    if (this.matchIdentifier("not")) {
      return operation("not", [this.parseNot()]);
    }
    return this.parseComparison();
  }

  private parseComparison(): ExpressionNode {
    const left = this.parsePrimaryWithCasts();
    if (this.matchIdentifier("between")) {
      const lower = this.parsePrimaryWithCasts();
      this.expectIdentifier("and");
      const upper = this.parsePrimaryWithCasts();
      return operation("and", [
        operation("gte", [left, lower]),
        operation("lte", [left, upper]),
      ]);
    }
    if (this.matchIdentifier("in")) {
      this.expectPunctuation("(");
      const values = this.parseList(")");
      return operation("in", [left, { kind: "array", values }]);
    }
    if (this.matchIdentifier("is")) {
      const negated = this.matchIdentifier("not");
      this.expectIdentifier("null");
      return operation(negated ? "isNotNull" : "isNull", [left]);
    }
    const operatorToken = this.peek();
    if (operatorToken?.kind !== "operator" || !COMPARISON_OPERATORS[operatorToken.value]) {
      return left;
    }
    this.position += 1;
    const operatorName = COMPARISON_OPERATORS[operatorToken.value];
    if (operatorName === "eq" && this.matchIdentifier("any")) {
      this.expectPunctuation("(");
      const values = this.parsePrimaryWithCasts();
      this.expectPunctuation(")");
      if (values.kind !== "array") throw new Error("ANY requires an ARRAY expression");
      return operation("in", [left, values]);
    }
    return operation(operatorName, [left, this.parsePrimaryWithCasts()]);
  }

  private parsePrimaryWithCasts(): ExpressionNode {
    const expression = this.parsePrimary();
    while (this.matchOperator("::")) this.consumeTypeName();
    return expression;
  }

  private parsePrimary(): ExpressionNode {
    if (this.matchPunctuation("(")) {
      const expression = this.parseOr();
      this.expectPunctuation(")");
      return expression;
    }
    if (this.matchOperator("-")) {
      return operation("negate", [this.parsePrimaryWithCasts()]);
    }
    const token = this.consume();
    if (token.kind === "number") {
      return { kind: "literal", value: Number(token.value) };
    }
    if (token.kind === "string") {
      return { kind: "literal", value: token.value };
    }
    if (token.kind !== "identifier") {
      throw new Error(`Unsupported SQL token ${token.value}`);
    }
    if (token.value === "true" || token.value === "false") {
      return { kind: "literal", value: token.value === "true" };
    }
    if (token.value === "null") return { kind: "literal", value: null };
    if (token.value === "array" && this.matchPunctuation("[")) {
      return { kind: "array", values: this.parseList("]") };
    }

    const identifierParts = [token.value];
    while (this.matchPunctuation(".")) {
      identifierParts.push(this.expect("identifier").value);
    }
    const name = identifierParts.at(-1) ?? token.value;
    if (this.matchPunctuation("(")) {
      return {
        kind: "call",
        name,
        arguments: this.parseList(")"),
      };
    }
    return { kind: "identifier", name };
  }

  private parseList(terminator: ")" | "]") {
    const values: ExpressionNode[] = [];
    if (this.matchPunctuation(terminator)) return values;
    do values.push(this.parseOr()); while (this.matchPunctuation(","));
    this.expectPunctuation(terminator);
    return values;
  }

  private consumeTypeName() {
    this.expect("identifier");
    while (this.matchPunctuation(".")) this.expect("identifier");
    while (this.peek()?.kind === "identifier" &&
      ["varying", "precision", "with", "without", "time", "zone"].includes(this.peek()!.value)) {
      this.position += 1;
    }
    if (this.matchPunctuation("[")) this.expectPunctuation("]");
  }

  private peek() {
    return this.tokens[this.position];
  }

  private consume() {
    const token = this.tokens[this.position];
    if (!token) throw new Error("Unexpected end of SQL expression");
    this.position += 1;
    return token;
  }

  private expect(kind: ExpressionToken["kind"]) {
    const token = this.consume();
    if (token.kind !== kind) throw new Error(`Expected ${kind}, received ${token.value}`);
    return token;
  }

  private matchIdentifier(value: string) {
    if (this.peek()?.kind === "identifier" && this.peek()?.value === value) {
      this.position += 1;
      return true;
    }
    return false;
  }

  private expectIdentifier(value: string) {
    if (!this.matchIdentifier(value)) throw new Error(`Expected ${value}`);
  }

  private matchOperator(value: string) {
    if (this.peek()?.kind === "operator" && this.peek()?.value === value) {
      this.position += 1;
      return true;
    }
    return false;
  }

  private matchPunctuation(value: string) {
    if (this.peek()?.kind === "punctuation" && this.peek()?.value === value) {
      this.position += 1;
      return true;
    }
    return false;
  }

  private expectPunctuation(value: string) {
    if (!this.matchPunctuation(value)) throw new Error(`Expected ${value}`);
  }
}

const COMPARISON_OPERATORS: Record<string, string> = {
  "=": "eq",
  "!=": "ne",
  "<>": "ne",
  ">": "gt",
  ">=": "gte",
  "<": "lt",
  "<=": "lte",
};

function operation(operator: string, operands: ExpressionNode[]): ExpressionNode {
  let canonicalOperands = operands;
  if (operator === "and" || operator === "or") {
    canonicalOperands = operands.flatMap((operand) =>
      operand.kind === "operation" && operand.operator === operator
        ? operand.operands
        : [operand]
    );
  }
  if (["and", "or", "eq", "ne"].includes(operator)) {
    canonicalOperands = canonicalOperands
      .slice()
      .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  if (operator === "in" && canonicalOperands[1]?.kind === "array") {
    canonicalOperands = [canonicalOperands[0], {
      kind: "array",
      values: canonicalOperands[1].values
        .slice()
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    }];
  }
  return { kind: "operation", operator, operands: canonicalOperands };
}

function tokenizeSqlExpression(value: string): ExpressionToken[] {
  const tokens: ExpressionToken[] = [];
  let position = 0;
  while (position < value.length) {
    const character = value[position];
    if (/\s/.test(character)) {
      position += 1;
      continue;
    }
    if (character === '"') {
      let identifier = "";
      position += 1;
      while (position < value.length) {
        if (value[position] === '"' && value[position + 1] === '"') {
          identifier += '"';
          position += 2;
        } else if (value[position] === '"') {
          position += 1;
          break;
        } else {
          identifier += value[position++];
        }
      }
      tokens.push({ kind: "identifier", value: identifier.toLowerCase() });
      continue;
    }
    if (character === "'") {
      let literal = "";
      position += 1;
      while (position < value.length) {
        if (value[position] === "'" && value[position + 1] === "'") {
          literal += "'";
          position += 2;
        } else if (value[position] === "'") {
          position += 1;
          break;
        } else {
          literal += value[position++];
        }
      }
      tokens.push({ kind: "string", value: literal });
      continue;
    }
    const twoCharacters = value.slice(position, position + 2);
    if (["::", ">=", "<=", "<>", "!="].includes(twoCharacters)) {
      tokens.push({ kind: "operator", value: twoCharacters });
      position += 2;
      continue;
    }
    if (/[0-9]/.test(character)) {
      let end = position + 1;
      while (end < value.length && /[0-9.]/.test(value[end])) end += 1;
      tokens.push({ kind: "number", value: value.slice(position, end) });
      position = end;
      continue;
    }
    if (/[a-z_$]/i.test(character)) {
      let end = position + 1;
      while (end < value.length && /[a-z0-9_$]/i.test(value[end])) end += 1;
      tokens.push({
        kind: "identifier",
        value: value.slice(position, end).toLowerCase(),
      });
      position = end;
      continue;
    }
    if ("(),[].".includes(character)) {
      tokens.push({ kind: "punctuation", value: character });
      position += 1;
      continue;
    }
    if ("=><+-*/".includes(character)) {
      tokens.push({ kind: "operator", value: character });
      position += 1;
      continue;
    }
    throw new Error(`Unsupported SQL character ${character}`);
  }
  return tokens;
}

function canonicalColumn(
  table: string,
  column: string,
  type: string,
  notNull: boolean,
  defaultValue: string,
) {
  return `${table}.${column}:${type}:${notNull ? "required" : "nullable"}:${defaultValue}`;
}

function normalizeType(type: string) {
  return type
    .replace(/^app_private\./, "")
    .replace(/^character varying/, "varchar")
    .replace(/,\s*/g, ", ")
    .replace(/^bigserial$/, "bigint")
    .replace(/^serial$/, "integer");
}

function expectedDefault(
  table: string,
  columnName: string,
  column: SnapshotColumn,
) {
  if (column.type === "serial" || column.type === "bigserial") {
    return `sequence:${table}_${columnName}_seq`;
  }
  if (column.default === undefined) return "none";
  return normalizeSqlExpression(String(column.default));
}

function actualDefault(value: unknown) {
  if (value === null || value === undefined) return "none";
  const expression = String(value);
  const sequence = /^nextval\('(?:app_private\.)?([^']+)'::regclass\)$/.exec(
    expression,
  );
  if (sequence) return `sequence:${sequence[1].replaceAll('"', "")}`;
  return normalizeSqlExpression(expression);
}

function normalizeSqlExpression(value: string) {
  return value
    .replace(/::(?:[a-z_][a-z0-9_]*\.)?[a-z_][a-z0-9_]*(?:\[\])?/gi, "")
    .replace(/^\((.*)\)$/, "$1")
    .trim();
}
