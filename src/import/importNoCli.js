const {generate, sanitizeData} = require('./generateTables');
const {generateSql, runSql} = require('./sql');
const {trackTables} = require('./track');
const {getInsertOrder, insertData} = require('./insertNoCli');
const {createRelationships} = require('./relationships');
const {createTables} = require('./checkNoCli');

const importData = async (schema, jsonDb, url, headers, overwrite) => {
  const db = sanitizeData(jsonDb);
  const tables = generate(db);
  const sql = generateSql(schema, tables);
  await createTables(schema, tables, url, headers, overwrite, runSql, sql)
  await trackTables(schema, tables, url, headers)
  await createRelationships(schema, tables, url, headers)
  const insertOrder = getInsertOrder(tables);
  await insertData(schema, insertOrder, db, tables, url, headers);

  // createTables(schema, tables, url, headers, overwrite, runSql, sql).then(() => {
  //   trackTables(schema, tables, url, headers).then(() => {
  //     createRelationships(tables, url, headers).then(() => {
  //       const insertOrder = getInsertOrder(tables);
  //       insertData(schema, insertOrder, db, tables, url, headers);
  //     });
  //   });
  // });
};

module.exports = importData;
