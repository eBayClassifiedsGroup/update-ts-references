const path = require('path');
const fs = require('fs');
const { parse, CommentArray } = require("comment-json")
const { setup } = require('./setup');

const rootFolderYarn = path.join(process.cwd(), 'test-run', 'yarn-ws');
const rootFolderYarnEmptyCompilerOptions = path.join(process.cwd(), 'test-run', 'yarn-ws-empty-compilerOptions')
const rootFolderYarnNohoist = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-nohoist'
);
const rootFolderTsRefNoRoot = path.join(process.cwd(), 'test-run', 'ts-ref-noroot');

const rootFolderYarnCreate = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-create'
);
const rootFolderPnpm = path.join(process.cwd(), 'test-run', 'pnpm');
const rootFolderTsPaths = path.join(process.cwd(), 'test-run', 'ts-paths');
const rootFolderTsPathsIgnore = path.join(process.cwd(), 'test-run', 'ts-paths-ignore');

const rootFolderLerna = path.join(process.cwd(), 'test-run', 'lerna');
const rootFolderConfigName = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-custom-tsconfig-names'
);

const compilerOptions = { outDir: 'dist', rootDir: 'src' };


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

const tsconfigsIncludingPrepend = [
    rootTsConfig,
    [
        './workspace-a',
        {
            compilerOptions,
            references: [
                {
                    path: '../utils/foos/foo-a',
                    prepend: false,
                },
                {
                    path: '../workspace-b',
                },
            ],
        },
    ],
    wsBTsConfig,
    wsCTsConfig,
    wsDTsConfig,
    fooATsConfig,
    fooBTsConfig,
];

test('avoid adding an empty compilerOptions', async () => {
    const rootTsConfig = [
        '.',
        {
            extends: "./tsconfig.base.json",
            references: [
                {
                    path: 'workspace-a',
                },
                {
                    path: 'workspace-b',
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
                    path: '../workspace-b',
                },
            ],
        },
    ];

    const wsBTsConfig = [
        './workspace-b',
        {
            "extends": "./tsconfig.base.json"
        },
    ];
    const configs = [rootTsConfig, wsATsConfig, wsBTsConfig]

    await setup(rootFolderYarnEmptyCompilerOptions)

    configs.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarnEmptyCompilerOptions, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    })
})

test('Support yarn and npm workspaces', async () => {
    await setup(rootFolderYarn);

    tsconfigsIncludingPrepend.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarn, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);


    });
    // still has the comment
    expect(fs.readFileSync(path.join(rootFolderYarn, 'tsconfig.json')).toString()).toMatch(/\/\* Basic Options \*\//)
});

test('Support lerna', async () => {
    await setup(rootFolderLerna);

    tsconfigs.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderLerna, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });
});

test('Support yarn and npm workspaces with noHoist', async () => {
    await setup(rootFolderYarnNohoist);

    tsconfigs.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarnNohoist, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });
});

test('Support pnpm workspaces', async () => {
    await setup(rootFolderPnpm);

    tsconfigs.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderPnpm, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });
});

test('create paths mappings ', async () => {
    await setup(rootFolderTsPaths, undefined, undefined, undefined, true);


    const rootTsConfig = [
        '.',
        {
            compilerOptions: {
                composite: true,
                paths: { "foo-a": ["utils/foos/foo-a/src"], "foo-b": ["utils/foos/foo-b/src"], "workspace-a": ["workspace-a/src"], "workspace-b": ["workspace-b"] }
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
                {
                    path: 'utils/foos/foo-b',
                },
            ],
        },
    ];

    const wsATsConfig = [
        './workspace-a',
        {
            compilerOptions: {
                ...compilerOptions,
                paths: { "foo-a": ["../utils/foos/foo-a/src"], "js-only": ["../utils/foos/js-only/src"], "workspace-b": ["../workspace-b"] }
            },
            references: [
                {
                    path: '../utils/foos/foo-a',
                },
                {
                    path: '../utils/foos/js-only/jsconfig.json',
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
            compilerOptions: { ...compilerOptions, rootDir: '.', paths: { "foo-b": ["../utils/foos/foo-b/src"] } },
            references: [
                {
                    path: '../utils/foos/foo-b',
                },
            ],
        },
    ];

    const fooATsConfig = [
        './utils/foos/foo-a',
        {
            compilerOptions: {
                ...compilerOptions,
                rootDir: "src",
                paths: {
                    "foo-b": ["../foo-b/src"]
                },
            },
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
    [rootTsConfig, wsATsConfig, wsBTsConfig, fooATsConfig, fooBTsConfig].forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderTsPaths, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });

});

test('create paths mappings with ignorePathMappings', async () => {
    await setup(rootFolderTsPathsIgnore, undefined, undefined, undefined, true);


    const rootTsConfig = [
        '.',
        {
            compilerOptions: {
                composite: true,
                paths: { "foo-a": ["utils/foos/foo-a/src"], "foo-b": ["utils/foos/foo-b/src"], "workspace-b": ["workspace-b"] }
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
                {
                    path: 'utils/foos/foo-b',
                },
            ],
        },
    ];

    const wsATsConfig = [
        './workspace-a',
        {
            compilerOptions: {
                ...compilerOptions,
                paths: { "foo-a": ["../utils/foos/foo-a/src"], "workspace-b": ["../workspace-b"] }
            },
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
            compilerOptions: { ...compilerOptions, rootDir: '.', paths: { "foo-b": ["../utils/foos/foo-b/src"] } },
            references: [
                {
                    path: '../utils/foos/foo-b',
                },
            ],
        },
    ];

    const fooATsConfig = [
        './utils/foos/foo-a',
        {
            compilerOptions: {
                ...compilerOptions,
                rootDir: "src",
                paths: {
                    "foo-b": ["../foo-b/src"]
                },
            },
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
    [rootTsConfig, wsATsConfig, wsBTsConfig, fooATsConfig, fooBTsConfig].forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderTsPathsIgnore, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });

});

test('Test create tsconfig', async () => {
    await setup(rootFolderYarnCreate, undefined, undefined, true);
    const r = [
        '.',
        {
            extends: [`./tsconfig.base.json`],
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
                }
            ],
        },
    ];
    const a = [
        './workspace-a',
        {
            extends: "../tsconfig.base.json",
            compilerOptions: {
                outDir: "dist",
                rootDir: "src"
            },
            references: [
                {
                    path: '../workspace-b',
                },
            ],
        },
    ];
    const b = [
        './workspace-b',
        {
            compilerOptions
        },
    ];

    [r, a, b].forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderYarnCreate, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });
    expect(fs.existsSync(path.join(rootFolderYarnCreate, 'workspace-c', 'tsconfig.json'))).toBeFalsy();
});

test('Support option --withoutRootConfig', async () => {
    await setup(rootFolderTsRefNoRoot, undefined, undefined, undefined, undefined, undefined, true);

    const tsconfigs = [
        [
            '.',
            {
                compilerOptions: {
                    composite: true,
                },
                files: []
            },
        ],
        wsATsConfig,
        wsBTsConfig,
        wsCTsConfig,
        wsDTsConfig,
        fooATsConfig,
        fooBTsConfig,
    ]

    tsconfigs.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderTsRefNoRoot, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });

    // should not touch the ignore config
    expect(
        parse(fs.readFileSync(path.join(rootFolderTsRefNoRoot, 'workspace-ignore', 'tsconfig.json')).toString())
    ).toEqual({ compilerOptions });
});


test('Support custom tsconfig names', async () => {
    const configName = 'tsconfig.dev.json';
    const rootConfigName = 'tsconfig.ref.json';
    const rootFolder = rootFolderConfigName;
    await setup(rootFolder, configName, rootConfigName);

    const tsconfigs = [
        [
            '.',
            {
                compilerOptions: {
                    composite: true,
                },
                files: [],
                references: [
                    {
                        path: 'workspace-a/tsconfig.dev.json',
                    },
                    {
                        path: 'workspace-b/tsconfig.dev.json',
                    },
                    {
                        path: 'shared/workspace-c/tsconfig.dev.json',
                    },
                    {
                        path: 'shared/workspace-d/tsconfig.dev.json',
                    },
                    {
                        path: 'utils/foos/foo-a/tsconfig.dev.json',
                    },
                    {
                        path: 'utils/foos/foo-b',
                    },
                ],
            },
            rootConfigName
        ],
        [
            './workspace-a',
            {
                compilerOptions,
                references: [
                    {
                        path: '../utils/foos/foo-a/tsconfig.dev.json',
                        prepend: false,
                    },
                    {
                        path: '../utils/foos/js-only/jsconfig.dev.json',
                    },
                    {
                        path: '../workspace-b/tsconfig.dev.json',
                    },
                ],
            },
        ],
        wsBTsConfig,
        [
            './shared/workspace-c',
            {
                compilerOptions,

                references: [
                    {
                        path: '../../utils/foos/foo-a/tsconfig.dev.json',
                    },
                    {
                        path: '../../utils/foos/js-only2/jsconfig.json',
                    },
                ],
            },
        ],
        [
            './shared/workspace-d',
            {
                compilerOptions,

                references: [
                    {
                        path: '../workspace-c/tsconfig.dev.json',
                    },
                ],
            },
        ],
        [
            './utils/foos/foo-a',
            {
                compilerOptions,
                references: [
                    {
                        path: '../foo-b',
                    },
                ],
            },
        ],
        [...fooBTsConfig, 'tsconfig.json'],
    ];

    tsconfigs.forEach((tsconfig) => {
        const [configPath, config, configNameOverride] = tsconfig;
        expect(
            parse(fs.readFileSync(path.join(rootFolder, configPath, configNameOverride || configName)).toString())
        ).toEqual(
            config
        );
    });
});
