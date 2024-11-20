const {setup} = require('./setup');
const path = require('path');
const fs = require('fs');
const {parse} = require("comment-json")

const rootFolderTsRefYaml = path.join(process.cwd(), 'test-run', 'ts-ref-yaml');
const rootFolderTsRefNoRootYaml = path.join(process.cwd(), 'test-run', 'ts-ref-noroot-yaml');
const rootFolderTsOptionsYaml = path.join(process.cwd(), 'test-run', 'ts-options-yaml');
const rootFolderUsecaseYaml = path.join(process.cwd(), 'test-run', 'ts-options-usecase-yaml');

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


test('Support update-ts-reference.yaml workspaces', async () => {
    await setup(rootFolderTsRefYaml);

    tsconfigs.forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderTsRefYaml, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });

    // should not touch the ignore config
    expect(
        parse(fs.readFileSync(path.join(rootFolderTsRefYaml, 'workspace-ignore', 'tsconfig.json')).toString())
    ).toEqual({compilerOptions});
});

test('Support update-ts-reference.yaml workspaces with option withoutRootConfig = true', async () => {
    await setup(rootFolderTsRefNoRootYaml);

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
            parse(fs.readFileSync(path.join(rootFolderTsRefNoRootYaml, configPath, 'tsconfig.json')).toString())
        ).toEqual(config);
    });

    // should not touch the ignore config
    expect(
        parse(fs.readFileSync(path.join(rootFolderTsRefNoRootYaml, 'workspace-ignore', 'tsconfig.json')).toString())
    ).toEqual({compilerOptions});
});

test('receive options via the config', async () => {
    await setup(rootFolderTsOptionsYaml);
    const root = [
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
            ],
        },
    ];

    const a = [
        './workspace-a',
        {
            compilerOptions: {
                ...compilerOptions,
                paths: {"workspace-b": ["../workspace-b/src"]}
            },
            references: [
                {
                    path: '../workspace-b/tsconfig.dev.json',
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

    [root,a,b].forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderTsOptionsYaml, configPath, configPath === '.'?'tsconfig.root.json':'tsconfig.dev.json')).toString())
        ).toEqual(config);
    });

    // should not touch the ignore config
    expect(
        parse(fs.readFileSync(path.join(rootFolderTsOptionsYaml, 'workspace-ignore', 'tsconfig.json')).toString())
    ).toEqual({compilerOptions});
});

test('receive options for a different usecase', async () => {
    await setup(rootFolderUsecaseYaml, undefined, undefined, undefined, undefined, 'update-ts-references.e2e.yaml');
    const root = [
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
            ],
        },
    ];

    const a = [
        './workspace-a',
        {
            compilerOptions: {
                ...compilerOptions,
                paths: {"workspace-b": ["../workspace-b/src"]}
            },
            references: [
                {
                    path: '../workspace-b/tsconfig.dev.json',
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

    [root,a,b].forEach((tsconfig) => {
        const [configPath, config] = tsconfig;

        expect(
            parse(fs.readFileSync(path.join(rootFolderUsecaseYaml, configPath, configPath === '.'?'tsconfig.root.json':'tsconfig.dev.json')).toString())
        ).toEqual(config);
    });

    // should not touch the ignore config
    expect(
        parse(fs.readFileSync(path.join(rootFolderUsecaseYaml, 'workspace-ignore', 'tsconfig.json')).toString())
    ).toEqual({compilerOptions});
});
