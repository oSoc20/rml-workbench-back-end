const fs = require('fs');
const ncp = require('ncp').ncp;
const b64helper = require('./base64');
const dockerHelper = require('./dockerCompose');
const p = require('path');

module.exports.createWorkspace = (uniqid, mapperId) => {
    return new Promise((resolve, reject) => {
        const folderPath = `./workspaces/${uniqid}/mapper-${mapperId}`;
        ncp.limit = 16;

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);

            ncp(
                './workspaces/DEFAULT',
                folderPath,
                {
                    filter: (path) => {
                        return !(path.indexOf('mapper-image') > -1);
                    },
                },
                function (err) {
                    if (err) {
                        reject(err);
                    }
                    resolve(folderPath);
                },
            );
        } else {
            reject(new Error('Directory already exists'));
        }
    });
};

module.exports.createEmptyWorkspace = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;
    fs.mkdirSync(folderPath);
};

module.exports.deployWorkspace = (processors, sources, token) => {
    for (let index = 0; index < processors.length; index++) {
        const processor = processors[index];

        this.createWorkspace(token, index)
            .then((mapperFolder) => {
                //inputs
                for (source of processor.sources) {
                    b64helper.base64ToFile(sources[source], source, `${mapperFolder}/input`);
                }

                //mapper-config
                b64helper.base64ToFile(
                    processor.config,
                    'mapping.rml.ttl',
                    `${mapperFolder}/mapper-config`,
                );

                dockerHelper.editDC(token, processor.target, index);
            })
            .catch((err) => {
                console.error(err);
            });
    }
};

module.exports.deleteFolderRecursive = (path) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = p.join(path, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                this.deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};
