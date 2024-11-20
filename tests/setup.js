const execSh = require('exec-sh').promise;
const fs = require('fs');

const setup = async (rootFolder, configName, rootConfigName, createTsConfig, createPathMappings, usecase, withoutRootConfig,strict) => {
    if (!fs.existsSync(rootFolder)) {
        throw new Error(`folder is missing -> ${rootFolder}`);
    }

    try {
        await execSh(
            `npx update-ts-references ${process.env.DEBUG ? '--verbose':'' }${
                configName ? ` --configName ${configName}` : ''
            }${
                rootConfigName ? ` --rootConfigName ${rootConfigName}` : ''
            }${createTsConfig ? ` --createTsConfig` : ''}${createPathMappings ? ` --createPathMappings` : ''}${usecase ? ` --usecase ${usecase}` : ''}${withoutRootConfig? '--withoutRootConfig' : ''}${strict? '--strict' : ''}`,
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

module.exports = { setup }
