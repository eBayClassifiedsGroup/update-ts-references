const glob = require('glob');
const path = require('path');
const fs = require('fs');
const ts = require('typescript');
const yaml = require('js-yaml');
const minimatch = require('minimatch');
const readlineSync = require('readline-sync');
const assert = require('assert').strict;

const PACKAGE_JSON = 'package.json';
const TSCONFIG_JSON = 'tsconfig.json'

const defaultOptions = {
  configName: 'tsconfig.json',
  cwd: process.cwd(),
  verbose: false,
  discardComments: false,
  help: false,
  check: false,
};

const getAllPackageJsons = async (workspaces) => {
  const ignoreGlobs = [];
  const workspaceGlobs = [];

  workspaces.forEach((workspaceGlob) => {
    if (workspaceGlob.startsWith('!')) {
      ignoreGlobs.push(workspaceGlob);
    } else {
      workspaceGlobs.push(workspaceGlob);
    }
  });

  return Promise.all(
    workspaceGlobs.map(
      (workspace) =>
        new Promise((resolve, reject) => {
          glob(`${workspace}/${PACKAGE_JSON}`, (error, files) => {
            if (error) {
              reject(error);
            }
            resolve(files);
          });
        }),

      []
    )
  )
    .then((allPackages) =>
      allPackages.reduce(
        (flattendArray, files) => [...flattendArray, ...files],
        []
      )
    )
    .then((allPackages) =>
      allPackages.filter(
        (packageName) =>
          ignoreGlobs.reduce((prev, actualPattern) => {
            if (!prev) return prev;
            return minimatch(packageName, actualPattern);
          }, true) && !packageName.includes('node_modules')
      )
    );
};

const detectTSConfig = (directory, configName) => {
  let detectedConfig = fs.existsSync(path.join(directory, configName)) ? configName : null
  if (configName !== TSCONFIG_JSON && detectedConfig === null) {
    detectedConfig = fs.existsSync(path.join(directory, TSCONFIG_JSON)) ? TSCONFIG_JSON : null
  }
  return detectedConfig
}


const getPackageNamesAndPackageDir = (packageFilePaths) =>
  packageFilePaths.reduce((map, packageFilePath) => {
    const fullPackageFilePath = path.join(process.cwd(), packageFilePath);
    const packageJson = require(fullPackageFilePath);
    const { name } = packageJson;
    map.set(name, { packageDir: path.dirname(fullPackageFilePath) });
    return map;
  }, new Map());

const getReferencesFromDependencies = (
  configName,
  { packageDir },
  packageName,
  packagesMap,
  verbose
) => {
  const packageJsonFilePath = path.join(packageDir, PACKAGE_JSON);

  const {
    dependencies = {},
    peerDependencies = {},
    devDependencies = {},
  } = require(packageJsonFilePath);

  const mergedDependencies = {
    ...dependencies,
    ...peerDependencies,
    ...devDependencies,
  };
  if (verbose) console.log(`all deps from ${packageName}`, mergedDependencies);

  if (Object.keys(mergedDependencies).includes(packageName)) {
    throw new Error(
      `This package ${packageName} references itself, please check dependencies in package.json`
    );
  }

  return Object.keys(mergedDependencies)
    .reduce((referenceArray, dependency) => {
      if (packagesMap.has(dependency)) {
        const { packageDir: dependencyDir } = packagesMap.get(dependency);
        const relativePath = path.relative(packageDir, dependencyDir);
        const detectedConfig = detectTSConfig(dependencyDir, configName)
        if (detectedConfig !== null) {
          return [
            ...referenceArray,
            {
              path: detectedConfig !== TSCONFIG_JSON ? path.join(relativePath, detectedConfig) : relativePath,
            },
          ];
        }
      }
      return referenceArray;
    }, [])
    .sort((refA, refB) => (refA.path > refB.path ? 1 : -1));
};

const ensurePosixPathStyle = (reference) => ({
  ...reference,
  path: reference.path.split(path.sep).join(path.posix.sep),
});

const updateTsConfig = (
  configName,
  win32OrPosixReferences,
  discardComments,
  check,
  { packageDir } = { packageDir: process.cwd() }
) => {
  const references = (win32OrPosixReferences || []).map(ensurePosixPathStyle);
  const tsconfigFilePath = path.join(packageDir, configName);
  let pureJson = true;
  try {
    require(tsconfigFilePath);
  } catch (e) {
    pureJson = false;
  }

  const { config, error } = ts.readConfigFile(
    tsconfigFilePath,
    ts.sys.readFile
  );

  if (!error) {
    if (check === false && pureJson === false && discardComments === false) {
      if (
        !readlineSync.keyInYN(
          `Found comments in the tsconfig.${tsconfigFilePath}
Do you want to discard them and proceed ? `
        )
      ) {
        process.exit(0);
      }
    }

    const currentReferences = config.references || [];

    const mergedReferences = references.map((ref) => ({
      ...ref,
      ...currentReferences.find((currentRef) => currentRef.path === ref.path),
    }));

    let isEqual = false;
    try {
      assert.deepEqual(currentReferences, mergedReferences);
      isEqual = true;
    } catch (e) {
      // ignore me
    }
    if (!isEqual) {
      if (check === false) {
        const newTsConfig = JSON.stringify(
          {
            ...config,
            references: mergedReferences.length ? mergedReferences : undefined,
          },
          null,
          2
        );
        fs.writeFileSync(tsconfigFilePath, newTsConfig + '\n');
      }
      return 1;
    }
    return 0;
  } else {
    console.error(`could not read ${tsconfigFilePath}`, error);
  }
};

const execute = async ({
  cwd,
  verbose,
  discardComments,
  check,
  configName,
}) => {
  let changesCount = 0;
  // eslint-disable-next-line no-console
  console.log('updating tsconfigs');
  const packageJson = require(path.join(cwd, PACKAGE_JSON));

  let workspaces = packageJson.workspaces;
  if (!workspaces && fs.existsSync(path.join(cwd, 'lerna.json'))) {
    const lernaJson = require(path.join(cwd, 'lerna.json'));
    workspaces = lernaJson.packages;
  }

  if (!workspaces && fs.existsSync(path.join(cwd, 'pnpm-workspace.yaml'))) {
    const pnpmConfig = yaml.load(
      fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'))
    );
    workspaces = pnpmConfig.packages;
  }

  if (!workspaces) {
    throw new Error(
      'could not detect yarn workspaces or lerna in this repository'
    );
  }

  if (!Array.isArray(workspaces)) {
    workspaces = workspaces.packages;
  }

  const packageFilePaths = await getAllPackageJsons(workspaces);
  if (verbose) {
    console.log('packageFilePaths', packageFilePaths);
  }
  const packagesMap = getPackageNamesAndPackageDir(packageFilePaths);

  if (verbose) {
    console.log('packagesMap', packagesMap);
  }

  const rootReferences = [];

  packagesMap.forEach((packageEntry, packageName) => {
    const detectedConfig = detectTSConfig(packageEntry.packageDir, configName)

    if (detectedConfig) {
      rootReferences.push({
        path: path.join(path.relative(process.cwd(), packageEntry.packageDir), detectedConfig !== TSCONFIG_JSON ? detectedConfig : ''),
      });
      const references = getReferencesFromDependencies(
        configName,
        packageEntry,
        packageName,
        packagesMap,
        verbose
      );
      if (verbose) {
        console.log(`references of ${packageName}`, references);
      }
      changesCount += updateTsConfig(
        detectedConfig,
        references,
        discardComments,
        check,
        packageEntry
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(`NO ${configName === TSCONFIG_JSON ? configName : `${configName} nor ${TSCONFIG_JSON}`} for ${packageName}`);
    }
  });

  if (verbose) {
    console.log('rootReferences', rootReferences);
  }
  changesCount += updateTsConfig(
    configName,
    rootReferences,
    discardComments,
    check
  );

  if (verbose) {
    console.log(`counted changes ${changesCount}`);
  }
  return changesCount;
};

module.exports = { execute, defaultOptions };
