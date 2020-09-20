# update-ts-references

If your repository is a multi package repository (via [lerna.js](https://lerna.js.org/) or [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)) in combination with [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) from TypeScript, this tool will be very helpful by reading dependencies out of the _package.json_ and applying them to the _tsconfig.json_ as references.

There's a blog post that's a good introduction to it [Optimizing multi-package apps with TypeScript Project References](https://ebaytech.berlin/optimizing-multi-package-apps-with-typescript-project-references-d5c57a3b4440).

## Usage

You can just use it via npx

```
npx update-ts-references --help

  Usage: update-ts-references [options]

  Options:
    --help        Show help
    --cwd         Set working directory. Default: [current path]
    --discardComments     Discards comments when updating tsconfigs. Default: false
    --verbose     Show verbose output. Default: false
```

or you add it as dev dependency and include it in the `postinstall` script in the package.json

`yarn add update-ts-references --dev -W`

```
 "scripts": {
   "postinstall": "update-ts-references"
 },
```

## FAQ

> Where are the comments from my tsconfig?

_update-ts-references_ is **not** able to preserve comments in tsconfig files when it is updating the references. If you need comments for the case like, explaining why compiler options are set, please move this part including comments into a second file and use the `extends` functionallity (see [here](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#tsconfig-bases)).


# License

Copyright 2020 mobile.de
Developer: Mirko Kruschke

Use of this source code is governed by an MIT-style license that can be found in the LICENSE file or at https://opensource.org/licenses/MIT.
