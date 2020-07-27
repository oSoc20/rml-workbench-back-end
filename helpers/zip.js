var fs = require('fs');
var archiver = require('archiver');
const mkdirp = require('mkdirp');

module.exports.createZip = (uniqid) => {
    return new Promise((resolve, reject) => {
        const publicFolder = `./public/downloads/`;
        const folderPath = `./workspaces/${uniqid}`;

        if (!fs.existsSync(publicFolder)) {
            mkdirp.sync(publicFolder);
        }

        var output = fs.createWriteStream(`${publicFolder}/${uniqid}.zip`);
        var archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', function () {
            resolve();
        });

        archive.on('error', function (err) {
            console.error(err);
            reject(err);
        });

        archive.pipe(output);

        archive.directory(folderPath, false);
        archive.finalize();
    });
};

module.exports.createZipWithOutput = (uniqid, processorsLength) => {
    return new Promise((resolve, reject) => {
        const publicFolder = `./public/downloads/`;
        const folderPath = `./workspaces/${uniqid}`;

        if (!fs.existsSync(publicFolder)) {
            mkdirp.sync(publicFolder);
        }

        var output = fs.createWriteStream(`${publicFolder}/${uniqid}.zip`);
        var archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', function () {
            resolve();
        });

        archive.on('error', function (err) {
            console.error(err);
            reject(err);
        });

        archive.pipe(output);

        for (let index = 0; index < processorsLength; index++) {
            archive.directory(
                `${folderPath}/processor-${index}/output`,
                `output-processor-${index}`,
                false,
            );
        }
        archive.finalize();
    });
};
