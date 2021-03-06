const fs = require('fs');
const ncp = require('ncp').ncp;
const b64helper = require('./base64');
const dockerHelper = require('./dockerCompose');
const p = require('path');
const mkdirp = require('mkdirp');

module.exports.createWorkspace = (uniqid, processorId) => {
    return new Promise((resolve, reject) => {
        const folderPath = `./workspaces/${uniqid}/processor-${processorId}`;
        ncp.limit = 16;

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);

            ncp('./workspaces/DEFAULT', folderPath, {}, function (err) {
                if (err) {
                    reject(err);
                }
                mkdirp.sync(`${folderPath}/input`);
                mkdirp.sync(`${folderPath}/output`);
                mkdirp.sync(`${folderPath}/mapper-config`);
                resolve(folderPath);
            });
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
            .then((processorFolder) => {
                //inputs
                processor.sources.forEach((sourceId) => {
                    let source = sources.find((source) => source.id === sourceId);

                    if (source.type === 'file') {
                        b64helper.base64ToFile(
                            source.source,
                            source.filename,
                            `${processorFolder}/input`,
                        );
                    }
                    // Add more statements for other input type
                });

                //mapper-config
                b64helper.base64ToFile(
                    processor.config,
                    'mapping.rml.ttl',
                    `${processorFolder}/mapper-config`,
                );

                this.updateMapperConfigFile(token, index);

                if (processor.type === 'mapper') {
                    dockerHelper.editMapperDC(token, processor.target, index);
                }
                // Add more statements for other processor type
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

module.exports.updateMapperConfigFile = (uniqid, processorId) => {
    const filePath = `./workspaces/${uniqid}/processor-${processorId}/mapper-config/mapping.rml.ttl`;
    const pattern = /(?<=rml:source )"(\w*.\w*)"/g;

    fs.readFile(filePath, 'utf-8', function (err, data) {
        if (err) return console.log(err);

        let result = data.replace(pattern, '"input/$1"');

        fs.writeFileSync(filePath, result, 'utf-8', function (err) {
            if (err) return console.log(err);
        });
    });
};
