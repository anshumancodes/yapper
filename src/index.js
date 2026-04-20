#!/usr/bin/env node

const createsetup = require('./createsetup');
const getSchema = require('./schema');
const getService = require('./service');
const getController = require('./controller');
const getRoute = require('./route');

const arg = process.argv?.[2];

if (!arg) {
  console.error('Usage: yapp <module-name>');
  process.exit(1);
}

// to basicallu mormalize: kebab-case → PascalCase (Name) and camelCase (name)
const argArray = arg.split('-');
argArray.forEach((part, i) => {
  argArray[i] = part[0].toUpperCase() + part.slice(1).toLowerCase();
});
const Name = argArray.join('');
const name = Name[0].toLowerCase() + Name.slice(1);

console.log(`\n⚡ Generating module: ${Name}\n`);

createsetup(`src/schemas/${name}.schema.ts`,         getSchema(Name, name));
createsetup(`src/services/${name}.service.ts`,       getService(Name, name));
createsetup(`src/controllers/${name}.controller.ts`, getController(Name, name));
createsetup(`src/routes/${name}.route.ts`,           getRoute(Name, name));
