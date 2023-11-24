const execSh = require('exec-sh').promise;
const path = require('path');
const fs = require('fs');
const { parse } = require("comment-json")

const rootFolderYarn = path.join(process.cwd(), 'test-run', 'yarn-ws');
const rootFolderYarnNohoist = path.join(
  process.cwd(),
  'test-run',
  'yarn-ws-nohoist'
);

const rootFolderYarnCreate = path.join(
    process.cwd(),
    'test-run',
    'yarn-ws-create'
);
const rootFolderPnpm = path.join(process.cwd(), 'test-run', 'pnpm');
const rootFolderTsRefYaml = path.join(process.cwd(), 'test-run', 'ts-ref-yaml');
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
const rootFolderLerna = path.join(process.cwd(), 'test-run', 'lerna');
const rootFolderConfigName = path.join(
  process.cwd(),
  'test-run',
  'yarn-ws-custom-tsconfig-names'
);

const compilerOptions = { outDir: 'dist', rootDir: 'src' };

const setup = async (rootFolder, configName, rootConfigName, createTsConfig) => {
  if (!fs.existsSync(rootFolder)) {
    throw new Error(`folder is missing -> ${rootFolder}`);
  }

  try {
    await execSh(
      `npx update-ts-references --verbose${
      configName ? ` --configName ${configName}` : ''
      }${
          rootConfigName ? ` --rootConfigName ${rootConfigName}` : ''
      }${createTsConfig ? ` --createTsConfig` : ''}`,
      {
        cwd: rootFolder,
      }
    );
  } catch (e) {
    console.log('Error: ', e);
    console.log('Stderr: ', e.stderr);
    console.log('Stdout: ', e.stdout);
    throw e;
  }
};

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
      parse(fs.readFileSync(path.join(rootFolderTsRefYaml,'workspace-ignore', 'tsconfig.json')).toString())
  ).toEqual( {compilerOptions});
});

test('Test create tsconfig', async () => {
  await setup(rootFolderYarnCreate, undefined, undefined,true);
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

  [r,a,b].forEach((tsconfig) => {
    const [configPath, config] = tsconfig;

    expect(
        parse(fs.readFileSync(path.join(rootFolderYarnCreate, configPath, 'tsconfig.json')).toString())
    ).toEqual(config);
  });
  expect(fs.existsSync(path.join(rootFolderYarnCreate,'workspace-c', 'tsconfig.json'))).toBeFalsy();
});

test('Detect changes with the --check option', async () => {
  let errorCode = 0;
  try {
    await execSh('npx update-ts-references --check', {
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

test('No changes detected with the --check option', async () => {
  let errorCode = 0;
  try {
    await execSh('npx update-ts-references --check', {
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
