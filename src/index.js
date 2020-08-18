#!/usr/bin/env node

/* eslint-disable no-console */
const minimist = require('minimist');
const { execute, defaultOptions } = require('./update-ts-references');

const {
  cwd = defaultOptions.cwd,
  verbose = defaultOptions.verbose,
  help = defaultOptions.help,
  h = defaultOptions.help,
} = minimist(process.argv.slice(2));

if (help || h) {
  console.log(`
  Usage: update-ts-references [options]
  Options:
    --help        Show help
    --cwd         Set working directory. Default: ${defaultOptions.cwd}
    --verbose     Show verbose output. Default: ${defaultOptions.verbose}
  `);
  process.exit(0);
}

const run = async () => {
  try {
    await execute({
      cwd,
      verbose,
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
