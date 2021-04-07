const execSh = require('exec-sh').promise;
const path = require('path');
const fs = require('fs');

const rootFolderYarn = path.join(process.cwd(), 'test-run', 'yarn-ws');
const rootFolderYarnNohoist = path.join(
  process.cwd(),
  'test-run',
  'yarn-ws-nohoist'
);
const rootFolderPnpm = path.join(process.cwd(), 'test-run', 'pnpm');
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

const setup = async (rootFolder, configName) => {
  if (!fs.existsSync(rootFolder)) {
    throw new Error(`folder is missing -> ${rootFolder}`);
  }

  try {
    await execSh(
      `npx update-ts-references --discardComments${
        configName ? ` --configName ${configName}` : ''
      }`,
      {
        stdio: null,
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

test('Support yarn workspaces', async () => {
  await setup(rootFolderYarn);

  const tsconfigs = [
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

  tsconfigs.forEach((tsconfig) => {
    const [configPath, config] = tsconfig;

    expect(
      require(path.join(rootFolderYarn, configPath, 'tsconfig.json'))
    ).toEqual(config);
  });
});

test('Support lerna', async () => {
  await setup(rootFolderLerna);

  tsconfigs.forEach((tsconfig) => {
    const [configPath, config] = tsconfig;

    expect(
      require(path.join(rootFolderLerna, configPath, 'tsconfig.json'))
    ).toEqual(config);
  });
});

test('Support yarn workspaces with noHoist', async () => {
  await setup(rootFolderYarnNohoist);

  tsconfigs.forEach((tsconfig) => {
    const [configPath, config] = tsconfig;

    expect(
      require(path.join(rootFolderYarnNohoist, configPath, 'tsconfig.json'))
    ).toEqual(config);
  });
});

test('Support pnpm workspaces', async () => {
  await setup(rootFolderPnpm);

  tsconfigs.forEach((tsconfig) => {
    const [configPath, config] = tsconfig;

    expect(
      require(path.join(rootFolderPnpm, configPath, 'tsconfig.json'))
    ).toEqual(config);
  });
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
      require(path.join(rootFolderYarnCheck, configPath, 'tsconfig.json'))
        .references
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
      require(path.join(
        rootFolderYarnCheckNoChanges,
        configPath,
        'tsconfig.json'
      ))
    ).toEqual(config);
  });
});

test('Support custom tsconfig names', async () => {
  const configName = 'tsconfig.dev.json';
  const rootFolder = rootFolderConfigName;
  await setup(rootFolder, configName);

  const tsconfigs = [
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

  tsconfigs.forEach((tsconfig) => {
    const [configPath, config] = tsconfig;
    expect(require(path.join(rootFolder, configPath, configName))).toEqual(
      config
    );
  });
});
