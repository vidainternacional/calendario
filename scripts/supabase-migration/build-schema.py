"""Genera restauración por fases desde el catálogo del origen; no conecta a ninguna base.

El catálogo y el SQL generado permanecen en una carpeta privada fuera del repositorio.
Los disparadores, permisos finales y tareas se aplican después de verificar los datos.
"""
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
catalog = json.loads((root / 'source-catalog.json').read_text())
quote = lambda s: '"' + s.replace('"', '""') + '"'
literal = lambda s: "'" + s.replace("'", "''") + "'"
qualified = lambda s, n: quote(s) + '.' + quote(n)

def save(name, statements):
    (root / name).write_text('\n'.join(statements) + '\n')

extensions = []
for extension in catalog['extensions']:
    if extension['name'] == 'plpgsql':
        continue
    extensions.append('CREATE EXTENSION IF NOT EXISTS ' + quote(extension['name']) + ' WITH SCHEMA ' + quote(extension['schema']) + ';')
save('00-extensions.sql', extensions)

schema = ['CREATE SCHEMA IF NOT EXISTS internal;', 'REVOKE ALL ON SCHEMA internal FROM PUBLIC, anon, authenticated;']
for enum in catalog['types']:
    statement = 'CREATE TYPE ' + qualified(enum['schema'], enum['name']) + ' AS ENUM (' + ','.join(map(literal, enum['labels'])) + ');'
    schema.append('DO $restore$ BEGIN ' + statement + ' EXCEPTION WHEN duplicate_object THEN NULL; END $restore$;')
for table in catalog['tables']:
    columns = []
    for column in table['columns']:
        text = quote(column['name']) + ' ' + column['type']
        if column['identity']:
            text += ' GENERATED ' + ('ALWAYS' if column['identity'] == 'a' else 'BY DEFAULT') + ' AS IDENTITY'
        elif column['generated']:
            text += ' GENERATED ALWAYS AS (' + column['default'] + ') STORED'
        elif column['default']:
            text += ' DEFAULT ' + column['default']
        if column['not_null']:
            text += ' NOT NULL'
        columns.append(text)
    name = qualified(table['schema'], table['name'])
    schema.append('CREATE TABLE IF NOT EXISTS ' + name + ' (' + ',\n'.join(columns) + ');')
    if table['rls']:
        schema.append('ALTER TABLE ' + name + ' ENABLE ROW LEVEL SECURITY;')
    if table['force_rls']:
        schema.append('ALTER TABLE ' + name + ' FORCE ROW LEVEL SECURITY;')
save('01-tables.sql', schema)

functions = ["SET LOCAL check_function_bodies = false;"]
for function in catalog['functions']:
    functions.append(function['definition'].rstrip(';') + ';')
    name = qualified(function['schema'], function['name']) + '(' + function['identity_args'] + ')'
    functions.append('REVOKE ALL ON FUNCTION ' + name + ' FROM PUBLIC, anon, authenticated;')
save('02-functions.sql', functions)

indexes = []
foreign_keys = []
for table in catalog['tables']:
    name = qualified(table['schema'], table['name'])
    for constraint in table['constraints']:
        sql = 'ALTER TABLE ' + name + ' ADD CONSTRAINT ' + quote(constraint['name']) + ' ' + constraint['definition'] + ';'
        (foreign_keys if constraint['kind'] == 'f' else indexes).append(sql)
    indexes.extend(index.rstrip(';') + ';' for index in table['indexes'])
save('03-indexes.sql', indexes)
save('05-foreign-keys.sql', foreign_keys)

security = []
for policy in catalog['policies']:
    name = qualified(policy['schemaname'], policy['tablename'])
    roles = policy['roles']
    if isinstance(roles, str):
        roles = roles.strip('{}').split(',')
    sql = 'CREATE POLICY ' + quote(policy['policyname']) + ' ON ' + name
    sql += ' AS ' + policy['permissive'] + ' FOR ' + policy['cmd'] + ' TO ' + ','.join('PUBLIC' if r == 'public' else quote(r) for r in roles)
    if policy['qual']:
        sql += ' USING (' + policy['qual'] + ')'
    if policy['with_check']:
        sql += ' WITH CHECK (' + policy['with_check'] + ')'
    security.append(sql + ';')
for grant in catalog['table_grants']:
    if grant['grantee'] == 'postgres':
        continue
    sql = 'GRANT ' + grant['privilege_type'] + ' ON TABLE ' + qualified(grant['table_schema'], grant['table_name']) + ' TO ' + quote(grant['grantee'])
    security.append(sql + (' WITH GRANT OPTION' if grant['is_grantable'] == 'YES' else '') + ';')
for grant in catalog['function_grants']:
    if grant['grantee'] == 'postgres':
        continue
    grantee = 'PUBLIC' if grant['grantee'] == 'PUBLIC' else quote(grant['grantee'])
    sql = 'GRANT ' + grant['privilege'] + ' ON FUNCTION ' + qualified(grant['schema'], grant['name']) + '(' + grant['identity_args'] + ') TO ' + grantee
    security.append(sql + (' WITH GRANT OPTION' if grant['grantable'] else '') + ';')
for trigger in catalog['triggers']:
    security.append(trigger['definition'].rstrip(';') + ';')
    if trigger['enabled'] == 'D':
        security.append('ALTER TABLE ' + qualified(trigger['schema'], trigger['table']) + ' DISABLE TRIGGER ' + quote(trigger['name']) + ';')
for table in catalog['realtime_tables']:
    security.append('ALTER PUBLICATION supabase_realtime ADD TABLE ' + qualified(table['schema'], table['table']) + ';')
save('06-security-triggers.sql', security)

print(json.dumps({'tables': len(catalog['tables']), 'functions': len(catalog['functions']),
                  'foreign_keys': len(foreign_keys), 'policy_count': len(catalog['policies']),
                  'phase_files': sorted(p.name for p in root.glob('0*.sql'))}))
