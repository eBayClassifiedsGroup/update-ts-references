const glob = require('glob');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const minimatch = require('minimatch');
const {
    parse,
    stringify,
    assign
} = require('comment-json')
const assert = require('assert').strict;

const PACKAGE_JSON = 'package.json';
const TSCONFIG_JSON = 'tsconfig.json'

const defaultOptions = {
    configName: TSCONFIG_JSON,
    rootConfigName: TSCONFIG_JSON,
    withoutRootConfig: false,
    createTsConfig: false,
    cwd: process.cwd(),
    verbose: false,
    help: false,
    check: false,
    createPathMappings: false,
    usecase: 'update-ts-references.yaml',
    strict: false
};

const getAllPackageJsons = async (workspaces, cwd) => {
    const ignoreGlobs = [];
    const workspaceGlobs = [];

    workspaces.forEach((workspaceGlob) => {
        if (workspaceGlob.startsWith('!')) {
            ignoreGlobs.push(!workspaceGlob.includes('/') ? `${workspaceGlob}/${PACKAGE_JSON}` : workspaceGlob);
        } else {
            workspaceGlobs.push(workspaceGlob);
        }
    });

    return Promise.all(
        workspaceGlobs.map(
            (workspace) =>
                new Promise((resolve, reject) => {
                    glob(`${workspace}/${PACKAGE_JSON}`, {cwd}, (error, files) => {
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

const detectTSConfig = (directory, configName, createConfig, cwd) => {
    let detectedConfig = fs.existsSync(path.join(directory, configName)) ? configName : null
    if (configName !== TSCONFIG_JSON && detectedConfig === null) {
        detectedConfig = fs.existsSync(path.join(directory, TSCONFIG_JSON)) ? TSCONFIG_JSON : null
    }
    if (detectedConfig === null && createConfig) {
        let maybeExtends = {}
        if (fs.existsSync(path.join(cwd, 'tsconfig.base.json'))) {
            maybeExtends = {
                extends: `${path.join(path.relative(directory, cwd), "tsconfig.base.json").split(path.sep).join(path.posix.sep)}`,
            }
        }
        const tsconfigFilePath = path.join(directory, configName);
        fs.writeFileSync(tsconfigFilePath, stringify(Object.assign(maybeExtends, {
            compilerOptions: {
                outDir: "dist",
                rootDir: "src"
            },
            references: [],
        }), null, 2) + '\n');

        return configName
    }
    return detectedConfig
}


const getPackageNamesAndPackageDir = (packageFilePaths, cwd) =>
    packageFilePaths.reduce((map, packageFilePath) => {
        const fullPackageFilePath = path.join(cwd, packageFilePath);
        const packageJson = require(fullPackageFilePath);
        const {name} = packageJson;
        map.set(name, {
            packageDir: path.dirname(fullPackageFilePath),
            hasTsEntry: /\.(ts|tsx)$/.test((packageJson.main ? packageJson.main : ''))
        });
        return map;
    }, new Map());

const getReferencesFromDependencies = (
    configName,
    {packageDir},
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
                const {packageDir: dependencyDir} = packagesMap.get(dependency);
                const relativePath = path.relative(packageDir, dependencyDir);
                const detectedConfig = detectTSConfig(dependencyDir, configName)
                if (detectedConfig !== null) {
                    return [
                        ...referenceArray,
                        {
                            name: dependency,
                            path: detectedConfig !== TSCONFIG_JSON ? path.join(relativePath, detectedConfig) : relativePath,
                            folder: relativePath,
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
    folder: reference.folder?.split(path.sep).join(path.posix.sep),
});

const updateTsConfig = (
    strict,
    configName,
    references,
    paths,
    check,
    createPathMappings = false,
    {packageDir} = {packageDir: process.cwd()},
) => {
    const tsconfigFilePath = path.join(packageDir, configName);

    try {
        const config = parse(fs.readFileSync(tsconfigFilePath).toString());

        const currentReferences = config.references || [];

        const mergedReferences = references.map(({path}) => ({
            path,
            ...currentReferences.find((currentRef) => currentRef.path === path),
        }));

        let isEqual = false;
        try {
            assert.deepEqual(JSON.parse(JSON.stringify(currentReferences)), mergedReferences);
            if (createPathMappings)
                assert.deepEqual(JSON.parse(JSON.stringify(config?.compilerOptions?.paths ?? {})), paths);
            isEqual = true;
        } catch (e) {
            // ignore me
        }
        if (!isEqual) {
            if (check === false) {

                const compilerOptions = config?.compilerOptions ?? {};
                if (createPathMappings && paths)
                    assign(compilerOptions,
                        paths && Object.keys(paths).length > 0 ? {
                            paths
                        } : {paths: undefined})

                const newTsConfig = assign(config,
                    {
                        compilerOptions,
                        references: mergedReferences.length ? mergedReferences : undefined,
                    }
                );
                fs.writeFileSync(tsconfigFilePath, stringify(newTsConfig, null, 2) + '\n');
            }
            return 1;
        }
        return 0;
    } catch (error) {
        console.error(`could not read ${tsconfigFilePath}`, error);
        if(strict)
            throw new Error('Expect always a tsconfig.json in the package directory while running in strict mode')
    }
};

function getPathsFromReferences(references, tsconfigMap) {
    return references.reduce((paths, ref) => {
       const rootFolder= tsconfigMap[ref.name]?.compilerOptions?.rootDir  ?? 'src'
        return {
        ...paths,
        [`${ref.name}`]: [`${ref.folder}${rootFolder === '.' ? '' : `/${rootFolder}`}`],
    }}, {});
}

const execute = async ({
                           cwd, createTsConfig,
                           verbose,
                           check,
                           usecase,
                           strict,
                           ...configurable
                       }) => {
    let changesCount = 0;
    // eslint-disable-next-line no-console
    console.log('updating tsconfigs');
    const packageJson = require(path.join(cwd, PACKAGE_JSON));

    let workspaces = packageJson.workspaces;
    if (workspaces && !Array.isArray(workspaces)) {
        workspaces = workspaces.packages;
    }

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

    let {
        configName,
        rootConfigName,
        createPathMappings,
        withoutRootConfig
    } = configurable

    if (fs.existsSync(path.join(cwd, usecase))) {
        const yamlConfig = yaml.load(
            fs.readFileSync(path.join(cwd, usecase))
        );
        configName = yamlConfig.configName ?? configName
        rootConfigName = yamlConfig.rootConfigName ?? rootConfigName
        createPathMappings = yamlConfig.createPathMappings ?? createPathMappings
        withoutRootConfig = yamlConfig.withoutRootConfig ?? withoutRootConfig
        workspaces = [...(yamlConfig.packages ? yamlConfig.packages : []), ...(workspaces ? workspaces : [])];

        if (verbose) {
            console.log(`configName ${configName}`);
            console.log(`rootConfigName ${rootConfigName}`);
            console.log(`createPathMappings ${createPathMappings}`)
            console.log('joined workspaces', workspaces);
        }
    }

    if (!workspaces) {
        throw new Error(
            'could not detect yarn/npm/pnpm workspaces or lerna in this repository'
        );
    }

    const packageFilePaths = await getAllPackageJsons(workspaces, cwd);
    if (verbose) {
        console.log('packageFilePaths', packageFilePaths);
    }
    const packagesMap = getPackageNamesAndPackageDir(packageFilePaths, cwd);

    if (verbose) {
        console.log('packagesMap', packagesMap);
    }

    let rootReferences = [];
    let rootPaths = [];
    let tsconfigMap = {}
    packagesMap.forEach((packageEntry, packageName) => {
        const detectedConfig = detectTSConfig(packageEntry.packageDir, configName, packageEntry.hasTsEntry && createTsConfig, cwd)

        if (detectedConfig) {
            const compilerOptions = parse(fs.readFileSync(path.join(packageEntry.packageDir, detectedConfig)).toString()).compilerOptions

            tsconfigMap = {
                ...tsconfigMap,
                [packageName]: {
                    detectedConfig,
                    compilerOptions
                }
            }
        }
    });

    packagesMap.forEach((packageEntry, packageName) => {
        const detectedConfig = tsconfigMap[packageName]?.detectedConfig

        if (detectedConfig) {
            rootReferences.push({
                name: packageName,
                path: path.join(path.relative(cwd, packageEntry.packageDir), detectedConfig !== TSCONFIG_JSON ? detectedConfig : ''),
                folder: path.relative(cwd, packageEntry.packageDir),
            });
            const references = (getReferencesFromDependencies(
                configName,
                packageEntry,
                packageName,
                packagesMap,
                verbose
            ) || []).map(ensurePosixPathStyle);

            const paths = getPathsFromReferences(references, tsconfigMap)

            if (verbose) {
                console.log(`references of ${packageName}`, references);
                console.log(`paths of ${packageName}`, paths);
            }

            changesCount += updateTsConfig(
                strict,
                detectedConfig,
                references,
                paths,
                check,
                createPathMappings,
                packageEntry
            );
        } else {
            // eslint-disable-next-line no-console
            console.log(`NO ${configName === TSCONFIG_JSON ? configName : `${configName} nor ${TSCONFIG_JSON}`} for ${packageName}`);
            rootPaths.push({
                name: packageName,
                path: path.relative(cwd, packageEntry.packageDir),
                folder: path.relative(cwd, packageEntry.packageDir),
            });
        }
    });

    rootReferences = (rootReferences || []).map(ensurePosixPathStyle);
    rootPaths = getPathsFromReferences((rootReferences || []).map(ensurePosixPathStyle), tsconfigMap)

    if (verbose) {
        console.log('rootReferences', rootReferences);
        console.log('rootPaths', rootPaths);
    }
    if(withoutRootConfig === false) {
        changesCount += updateTsConfig(
            strict,
            rootConfigName,
            rootReferences,
            rootPaths,
            check, createPathMappings, {packageDir: cwd},
        );
    }

    if (verbose) {
        console.log(`counted changes ${changesCount}`);
    }
    return changesCount;
};

module.exports = {execute, defaultOptions};
