# Contribution Guidelines

Thank you so much for wanting to contribute to update-ts-references! Here are a few important things you should know about contributing.

This project takes all contributions through <a href='https://help.github.com/articles/using-pull-requests'>pull requests</a>.
Code should _not_ be pushed directly to `master`.

The following guidelines apply to all contributors.

## General Guidelines

<ul>
  <li>Only one logical change per commit</li>
  <li>Do not mix whitespace changes with functional code changes</li>
  <li>Do not mix unrelated functional changes</li>
  <li>When writing a commit message:
    <ul>
    <li>Describe _why_ a change is being made</li>
    <li>Do not assume the reviewer understands what the original problem was</li>
    <li>Do not assume the code is self-evident/self-documenting</li>
    <li>Describe any limitations of the current code</li>
    </ul>
  </li>
  <li>Any significant changes should be accompanied by tests.</li>
  <li>The project already has good test coverage, so look at some of the existing tests if you're unsure how to go about it.</li>
</ul>

## Commit Message Guidelines

All commits should be structured after the [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) convention.

## Making Changes

- Fork the `update-ts-references` repository
- Install dependencies `yarn`
- Make your changes
- Run tests `yarn test`
- Push your changes to a branch in your fork
- See our commit message guidelines in this document
- Submit a pull request to the repository
