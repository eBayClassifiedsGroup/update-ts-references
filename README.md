# update-ts-references

If your repository is a multi package repository (via [lerna.js](https://lerna.js.org/) or [yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/)) in combination with [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) from TypeScript, this tool will be very helpful by reading dependencies out of the _package.json_ and applying them to the _tsconfig.json_ as references.

There's a blog post that's a good introduction to it [Multi packages application meets TypeScript](some path).

## Usage

You can just use it via npx

`npx update-ts-references`

or you add it as dev dependency and include it in the `postinstall` script in the package.json

`yarn add update-ts-references --dev -W`

```
 "scripts": {
   "postinstall": "update-ts-references"
 },
```
