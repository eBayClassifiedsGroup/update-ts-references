const execSh = require('exec-sh').promise;
const path = require('path');

const rootFolderYarn = path.join(process.cwd(), 'test-run/yarn-ws');
const rootFolderLerna = path.join(process.cwd(), 'test-run/lerna');
const compilerOptions = { outDir: 'dist', rootDir: 'src' };

const setup = async (rootFolder) => {
  try {
    await execSh('npx update-ts-references --discardComments', {
      stdio: null,
      cwd: rootFolder,
    });
  } catch (e) {
    console.log('Error: ', e);
    console.log('Stderr: ', e.stderr);
    console.log('Stdout: ', e.stdout);
    throw e;
  }
};

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
  ],
  [
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
  ],
  [
    './workspace-b',
    {
      compilerOptions,

      references: [
        {
          path: '../utils/foos/foo-b',
        },
      ],
    },
  ],
  [
    './shared/workspace-c',
    {
      compilerOptions,

      references: [
        {
          path: '../../utils/foos/foo-a',
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
          path: '../workspace-c',
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
  [
    './utils/foos/foo-b',
    {
      compilerOptions,
      references: undefined,
    },
  ],
];

test('Support yarn workspaces', async () => {
  await setup(rootFolderYarn);

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
