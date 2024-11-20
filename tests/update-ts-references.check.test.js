const path = require('path');
const fs = require('fs');
const {parse} = require("comment-json")
const {promise: execSh} = require("exec-sh");

const rootFolderYarnCheck = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-check'
);
const rootFolderYarnCheckNoChanges = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-check-no-changes'
);
const rootFolderYarnCheckStrict = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-check-strict'
);
const rootFolderYarnCheckPaths = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-check-paths'
);
const rootFolderYarnCheckPathsNoChanges = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-check-paths-no-changes'
);

const compilerOptions = {outDir: 'dist', rootDir: 'src'};

const rootTsConfig = [
    '.',
    {
        compilerOptions: {
            composite: true,
        },
        files: [],
        references: [
            {
                path: 'workspace-a',
            },
            {
                path: 'workspace-b',
            },
            {
                path: 'shared/workspace-c',
            },
            {
                path: 'shared/workspace-d',
            },
            {
                path: 'utils/foos/foo-a',
            },
            {
                path: 'utils/foos/foo-b',
            },
        ],
    },
];

const wsATsConfig = [
    './workspace-a',
    {
        compilerOptions,
        references: [
            {
                path: '../utils/foos/foo-a',
            },
            {
                path: '../workspace-b',
            },
        ],
    },
];

const wsBTsConfig = [
    './workspace-b',
    {
        compilerOptions,

        references: [
            {
                path: '../utils/foos/foo-b',
            },
        ],
    },
];

const wsCTsConfig = [
    './shared/workspace-c',
    {
        compilerOptions,

        references: [
            {
                path: '../../utils/foos/foo-a',
            },
        ],
    },
];

const wsDTsConfig = [
    './shared/workspace-d',
    {
        compilerOptions,

        references: [
            {
                path: '../workspace-c',
            },
        ],
    },
];

const fooATsConfig = [
    './utils/foos/foo-a',
    {
        compilerOptions,
        references: [
            {
                path: '../foo-b',
            },
        ],
    },
];

const fooBTsConfig = [
    './utils/foos/foo-b',
    {
        compilerOptions,
        references: undefined,
    },
];

const tsconfigs = [
    rootTsConfig,
    wsATsConfig,
    wsBTsConfig,
    wsCTsConfig,
    wsDTsConfig,
    fooATsConfig,
    fooBTsConfig,
];


test('Detect changes in references with the --check option', async () => {
    let errorCode = 0;
    try {
        await execSh('npx update-ts-references --check --strict', {
            stdio: null,
            cwd: rootFolderYarnCheck,
        });
    } catch (e) {
        errorCode = e.code;
    }

    expect(errorCode).toBe(6);

    tsconfigs.forEach((tsconfig) => {
        const [configPath] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarnCheck, configPath, 'tsconfig.json')).toString()).references
        ).toBeFalsy();
    });
});

test('No changes in references detected with the --check option', async () => {
    let errorCode = 0;
    try {
        await execSh('npx update-ts-references --check --strict', {
            stdio: null,
            cwd: rootFolderYarnCheckNoChanges,
        });
    } catch (e) {
        errorCode = e.code;
    }

    expect(errorCode).toBe(0);

    tsconfigs.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarnCheckNoChanges, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });
});

test('No changes in references detected with the --check option', async () => {
    let errorCode = 0;
    try {
        await execSh('npx update-ts-references --check --strict', {
            stdio: null,
            cwd: rootFolderYarnCheckStrict,
        });
    } catch (e) {
        errorCode = e.code;
    }

    expect(errorCode).toBe(1);
});

test('Detect changes in paths with the --check option', async () => {
    let errorCode = 0;
    try {
        await execSh('npx update-ts-references --check --createPathMappings', {
            stdio: null,
            cwd: rootFolderYarnCheckPaths,
        });
    } catch (e) {
        errorCode = e.code;
    }

    expect(errorCode).toBe(3);
    const root = [
        '.',
        {
            compilerOptions: {
                composite: true,
            },
            files: [],
            references: [
                {
                    path: 'workspace-a',
                },
                {
                    path: 'workspace-b',
                },
                {
                    path: 'utils/foos/foo-a',
                },
            ],
        },
    ];

    const a = [
        './workspace-a',
        {
            compilerOptions,
            references: [
                {
                    "path": "../utils/foos/foo-a",
                },
                {
                    path: '../workspace-b',
                },
            ],
        },
    ];

    const b = [
        './workspace-b',
        {
            compilerOptions,
        },
    ];

    const fooA = [
        './utils/foos/foo-a',
        {
        compilerOptions: {...compilerOptions, "paths": { "remove-me": ["../utils/remove/src"]}},
        },
    ];
    [root,a,b,fooA].forEach((tsconfig) => {
        const [configPath,config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarnCheckPaths, configPath, 'tsconfig.json')).toString())
        ).toEqual(config)
    });
});

test('No changes paths detected with the --check option', async () => {
    let errorCode = 0;
    try {
        await execSh('npx update-ts-references --check', {
            stdio: null,
            cwd: rootFolderYarnCheckPathsNoChanges,
        });
    } catch (e) {
        errorCode = e.code;
    }

    expect(errorCode).toBe(0);


    const root = [
        '.',
        {
            compilerOptions: {
                composite: true,
                paths: { "foo-b": ["utils/foos/foo-b/src"]}
            },
            files: [],
            references: [
                {
                    path: 'workspace-a',
                },
                {
                    path: 'workspace-b',
                },
                {
                    path: 'utils/foos/foo-a',
                },
            ],
        },
    ];

    const a = [
        './workspace-a',
        {
            compilerOptions: {
                ...compilerOptions,
                paths: { "foo-a": ["../utils/foos/foo-a/src"], "workspace-b": ["../workspace-b/src"],  }
            },
            references: [
                {
                    "path": "../utils/foos/foo-a",
                },
                {
                    path: '../workspace-b',
                },
            ],
        },
    ];

    const b = [
        './workspace-b',
        {
            compilerOptions,
        },
    ];

    const fooA = [
        './utils/foos/foo-a',
        {
            compilerOptions,
        },
    ];

    [root, a, b, fooA].forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarnCheckPathsNoChanges, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });
});


