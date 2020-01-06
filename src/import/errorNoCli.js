const {cli} = require('cli-ux');

module.exports = message => {
  console.log(message);
  throw new Error(message);
};
