const {generate, sanitizeData} = require('./generateTables');
const {generateSql, runSql} = require('./sql');
const {cli} = require('cli-ux');
const {trackTables} = require('./track');
const {getInsertOrder, insertData} = require('./insert');
const {createRelationships} = require('./relationships');
const {createTables} = require('./check');

const importData = async (schema, jsonDb, url, headers, overwrite) => {
  cli.action.start('Processing JSON data');
  const db = sanitizeData(jsonDb);
  const tables = generate(db);
  const sql = generateSql(schema, tables);
  cli.action.stop('Done!');
  cli.action.start('Checking database');
  createTables(schema, tables, url, headers, overwrite, runSql, sql).then(() => {
    cli.action.stop('Done!');
    cli.action.start('Tracking tables');
    trackTables(schema, tables, url, headers).then(() => {
      cli.action.stop('Done!');
      cli.action.start('Creating relationships');
      createRelationships(tables, url, headers).then(() => {
        cli.action.stop('Done!');
        cli.action.start('Inserting data');
        const insertOrder = getInsertOrder(tables);
        insertData(schema, insertOrder, db, tables, url, headers);
      });
    });
  });
};

module.exports = importData;
