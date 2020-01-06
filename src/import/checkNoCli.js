const fetch = require('node-fetch');
const throwError = require('./errorNoCli');

const createTables = async (schema, tables, url, headers, overwrite, runSql, sql) => {
  if (overwrite) {
    await runSql(sql, url, headers);
  } else {
    try {
      const resp = await fetch(
        `${url}/v1/query`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type: 'run_sql',
            args: {
              sql: `select * from information_schema.tables where table_schema = '${schema}';`,
            },
          }),
        }
      );
      const dbTables = await resp.json();
      let found = false;
      const tableIndex = (dbTables.result && dbTables.result.length) > 0 ? dbTables.result[0].indexOf('table_name') : -1;
      if (tableIndex >= 0 && dbTables.result.length > 1) {
        for (let i = dbTables.result.length - 1; i > 0; i--) {
          if (tables.find(t => t.name === dbTables.result[i][tableIndex])) {
            found = true;
            throwError(`Message: Your JSON database contains tables that already exist in Postgres ${schema} schema. Please use the flag "--overwrite" to overwrite them.`);
          }
        }
      } else {
        const createSchema = [`CREATE SCHEMA ${schema};`]
        await runSql(createSchema, url, headers);
      }
      if (!found) {
        await runSql(sql, url, headers);
      }
    } catch (e) {
      console.log('Unexpected: ', e);
    }
  }
};

module.exports = {
  createTables,
};
