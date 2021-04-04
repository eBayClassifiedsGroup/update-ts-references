const execSh = require('exec-sh').promise;
const path = require('path');
const rootFolder = path.join(process.cwd(), 'test-run/yarn-ws');

const setup = async () => {
  try {
    console.log(process.env.path);
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

setup().then(() => console.log('done....'));
