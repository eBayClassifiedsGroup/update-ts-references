#!/usr/bin/env node

/* eslint-disable no-console */
const minimist = require('minimist');
const { execute, defaultOptions } = require('./update-ts-references');

const {
  configName = defaultOptions.configName,
  cwd = defaultOptions.cwd,
  verbose = defaultOptions.verbose,
  help = defaultOptions.help,
  h = defaultOptions.help,
  check = defaultOptions.check,
} = minimist(process.argv.slice(2));

if (help || h) {
  console.log(`
  Usage: update-ts-references [options]
  Options:
    --configName  The name of the config files which needs to be updated. Default: ${defaultOptions.configName}
    --check       Checks if updates would be necessary (without applying them)
    --help        Show help
    --cwd         Set working directory. Default: ${defaultOptions.cwd}
    --verbose     Show verbose output. Default: ${defaultOptions.verbose}
  `);
  process.exit(0);
}

const run = async () => {
  try {
    const changesCount = await execute({
      cwd,
      verbose,
      check,
      configName,
    });

    if (check && changesCount > 0) {
      process.exit(changesCount);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();
