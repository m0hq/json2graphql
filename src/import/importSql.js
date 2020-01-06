const {generate, sanitizeData} = require('./generateTables');
const {generateSql} = require('./sql');

const importSql = (schema, jsonDb) => {
  const db = sanitizeData(jsonDb);
  const tables = generate(db);
  const sql = generateSql(schema, tables);
  return sql;
};

module.exports = importSql;
