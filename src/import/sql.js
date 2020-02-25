const fetch = require('node-fetch');
const throwError = require('./errorNoCli');

const runSql = async (sqlArray, url, headers) => {
  let sqlString = '';
  sqlArray.forEach(sql => {
    sqlString += sql;
  });
  const resp = await fetch(
    `${url}/v1/query`,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'run_sql',
        args: {
          sql: sqlString,
          cascade: true,
        },
      }),
      headers,
    }
  );
  if (resp.status !== 200) {
    const error = await resp.json();
    console.log('runSql error', error)
    throwError(JSON.stringify(error, null, 2));
  }
};

const generateCreateTableSql = (schema, metadata) => {
  const sqlArray = [];
  metadata.forEach(table => {
    sqlArray.push(`drop table if exists ${schema}."${table.name}" cascade;`);
    let columnSql = '(';
    table.columns.forEach((column, i) => {
      const maybeCascadeNull = column.name.indexOf('cascade_null_') === 0
      const maybeCascadeDelete = column.name.indexOf('cascade_delete_') === 0
      if (!maybeCascadeDelete && !maybeCascadeNull) {
        if (column.name === 'id') {
          columnSql += `"id" ${column.type} not null primary key`;
        } else {
          columnSql += `"${column.name}" ${column.type}`;
        }
        columnSql += (table.columns.length === i + 1) ? ' ) ' : ', ';
      }
    });
    const createTableSql = `create table ${schema}."${table.name}" ${columnSql};`;
    sqlArray.push(createTableSql);
  });
  return sqlArray;
};

const generateConstraintsSql = (schema, metadata) => {
  const sqlArray = [];
  metadata.forEach(table => {
    table.columns.forEach(column => {
      if (column.isForeign) {
        const suffix = table.isCascadeDelete ? ' on delete cascade' : table.isCascadeNull ? ' on delete set null' : ''
        const fkSql = `add foreign key ("${column.name}") references ${schema}."${column.name.substring(0, column.name.length - 3)}" ("id") ${suffix};`;
        sqlArray.push(`alter table ${schema}."${table.name}" ${fkSql}`);
      }
    });
  });
  return sqlArray;
};

const generateSql = (schema, metadata) => {
  const createTableSql = generateCreateTableSql(schema, metadata);
  const constraintsSql = generateConstraintsSql(schema, metadata);
  let sqlArray = [...createTableSql, ...constraintsSql];
  return sqlArray;
};

module.exports = {
  generateSql,
  runSql,
};
