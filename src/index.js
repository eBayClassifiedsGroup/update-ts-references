#!/usr/bin/env node

/* eslint-disable no-console */
const minimist = require('minimist');
const { execute, defaultOptions } = require('./update-ts-references');

const {
  configName = defaultOptions.configName,
  rootConfigName = defaultOptions.rootConfigName,
  withoutRootConfig= defaultOptions.withoutRootConfig,
  createTsConfig = defaultOptions.createTsConfig,
  cwd = defaultOptions.cwd,
  verbose = defaultOptions.verbose,
  help = defaultOptions.help,
  h = defaultOptions.help,
  check = defaultOptions.check,
  createPathMappings = defaultOptions.createPathMappings,
  usecase = defaultOptions.usecase,
  strict = defaultOptions.strict
} = minimist(process.argv.slice(2));
if (help || h) {
  console.log(`
  Usage: update-ts-references [options]
  Options:
    --configName    The name of the config files which needs to be updated. Default: ${defaultOptions.configName}
    --rootConfigName    The name of the root config file which needs to be updated. Default: ${defaultOptions.configName}
    --withoutRootConfig  If you will not have a tsconfig in the root directory or don't want to update it. Default: ${defaultOptions.withoutRootConfig}
    --check         Checks if updates would be necessary (without applying them)
    --help          Show help
    --createTsConfig  Create default TS configs for packages where the main entry in the package.json have a ts|tsx extension (Note: respects the --configName parameter)
    --createPathMappings Create paths mappings under compilerOptions for a better IDE support. It respects the rootDir if no rootDir available it falls back to "src"
    --cwd           Set working directory. Default: ${defaultOptions.cwd}
    --verbose       Show verbose output. Default: ${defaultOptions.verbose}
    --usecase       The use case for the script. Default: ${defaultOptions.usecase}
    --strict    Expects always a tsconfig.json in the package directory. Default: ${defaultOptions.strict}
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
      rootConfigName,
      withoutRootConfig,
      createTsConfig,
      createPathMappings,
      usecase,
      strict
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
