[![Test](https://github.com/eBayClassifiedsGroup/update-ts-references/actions/workflows/node.js.yml/badge.svg)](https://github.com/eBayClassifiedsGroup/update-ts-references/actions/workflows/node.js.yml)

# update-ts-references
If your repository is a multi package repository (via [lerna.js](https://lerna.js.org/), [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/), [pnpm workspaces](https://pnpm.js.org/workspaces) or since v7 [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)) in combination with [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) from TypeScript, this tool will be very helpful by reading dependencies out of the _package.json_ and applying them to the _tsconfig.json_ as references.

There's a blog post that's a good introduction to it [Optimizing multi-package apps with TypeScript Project References](https://medium.com/berlin-tech-blog/optimizing-multi-package-apps-with-typescript-project-references-d5c57a3b4440).

## Usage

You can just use it via npx

```
npx update-ts-references --help

  Usage: update-ts-references [options]

  Options:
    --configName    The name of the config files which needs to be updated. Default: tsconfig.json
    --check         Checks if updates would be necessary (without applying them)
    --help          Show help
    --createTsConfig  Create default TS configs for packages where the main entry in the package.json have a ts|tsx extension (Note: respects the --configName parameter)
    --cwd           Set working directory. Default: /Users/mirko.kruschke/coding/ecg-public/update-ts-references
    --verbose       Show verbose output. Default: false

```

or you add it as dev dependency and include it in the `postinstall` script in the package.json

`yarn add update-ts-references --dev -W`

```
 "scripts": {
   "postinstall": "update-ts-references"
 },
 "husky": {
    "hooks": {
      "pre-push": "update-ts-references --check"
    }
  },
```

enable pre-push via husky
```
npx husky add .husky/pre-push "npx update-ts-references --check"
git add .husky/pre-push
```

## using --creatTsConfig
Creates a basic tsconfig file for each package where the main entry in the package.json have a `.ts` or `.tsx` extension. It will respect the `--configName` parameter.

The output for the created file looks like the following

```json
{
  "extends": "../tsconfig.base.json", // add's extends in case you have a base config in the root directory 
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "references": [ // will be added after running update-ts-references 
    {
      "path": "../some-other-package"
    }
  ]
}
```

## using update-ts-references.yaml for configurations
You can configure paths via the _update-ts-references.yaml_ file. This is useful if your repo is having **no** _package.json_ or _pnp-workspace.yaml_ in the root folder. Additional to that it can also being used to extend the paths config next to the normal workspace setup via npm, pnpm, yarn and lerna so you can include or exclude some packages. 

Example configuration see [here](./test-scenarios/ts-ref-yaml/update-ts-references.yaml)



## FAQ
### Why is my pnpm workspace alias not working?

_update-ts-references_ is currently not supporting [Referencing workspace packages through aliases](https://pnpm.js.org/workspaces#referencing-workspace-packages-through-aliases) yet. See issue #13

# License

Copyright 2023 mobile.de
Developer: Mirko Kruschke

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at https://opensource.org/licenses/MIT.
