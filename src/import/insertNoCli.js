const {query} = require('graphqurl');
const moment = require('moment');
const throwError = require('./errorNoCli');

const getInsertOrder = tables => {
  let order = [];
  const tablesHash = {};
  tables.forEach(table => {
    tablesHash[table.name] = table;
  });
  const pushedHash = {};
  const setOrder = table => {
    if (table.dependencies.length === 0) {
      order.push(table.name);
      pushedHash[table.name] = true;
    } else {
      table.dependencies.forEach(parentTable => {
        if (!pushedHash[parentTable] && parentTable !== table.name) {
          setOrder(tablesHash[parentTable]);
        }
      });
      order.push(table.name);
      pushedHash[table.name] = true;
    }
  };

  tables.forEach(table => {
    if (!pushedHash[table.name]) {
      setOrder(table);
    }
  });
  return order;
};

const transformData = (data, tables) => {
  const newData = {};
  tables.forEach(table => {
    const tableData = data[table.name];
    newData[table.name] = [];
    tableData.forEach(row => {
      const filtered = {}
      Object.keys(row).forEach(column => {
        if (column.indexOf('cascade_null_') !== 0 && column.indexOf('cascade_delete_') !== 0) {
          filtered[column] = row[column]
        }
      })
      const newRow = {...filtered };
      table.columns.forEach(column => {
        if (column.type === 'timestamptz' && row[column.name]) {
          newRow[column.name] = moment(row[column.name]).format();
        }
        if (column.type === 'jsonb' && row[column.name]) {
          newRow[column.name] = JSON.stringify(row[column.name]);
        }
      });
      newData[table.name].push(newRow);
    });
  });
  return newData;
};

const insertData = async (schema, insertOrder, sampleData, tables, url, headers) => {
  const transformedData = transformData(sampleData, tables);
  let mutationString = '';
  let objectString = '';
  const variables = {};
  insertOrder.forEach(tableName => {
    mutationString += `insert_${schema}_${tableName} ( objects: $objects_${tableName} ) { affected_rows } \n`;
    objectString += `$objects_${tableName}: [${schema}_${tableName}_insert_input!]!,\n`;
    variables[`objects_${tableName}`] = transformedData[tableName];
  });
  const mutation = `mutation ( ${objectString} ) { ${mutationString} }`;
  try {
    const response = await query({
      query: mutation,
      endpoint: `${url}/v1/graphql`,
      variables,
      headers,
    });
    if (response.data !== null && response.data !== 'undefined') {
    } else {
      throw new Error(response);
    }
  } catch (e) {
    throwError(JSON.stringify(e, null, 2));
  }
};

module.exports = {
  getInsertOrder,
  insertData,
};
