#!/bin/bash
yarn link
rm -rf test-run
cp -R tests/scenarios test-run
find test-run  -maxdepth 1 -type d \( ! -name 'test-run' \) -exec bash -c "cd {} && yarn link update-ts-references " \;