var file_system = require('fs');
var archiver = require('archiver');

module.exports.createZip = (uniqid) => {
    return new Promise((resolve, reject) => {
        const publicFolder = `./public/downloads/`;
        const folderPath = `./workspaces/${uniqid}`;

        // if (!fs.existsSync(folderPath)){
        //     fs.mkdirSync(folderPath);
        // }

        var output = file_system.createWriteStream(`${publicFolder}/${uniqid}.zip`);
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
        //archive.directory('./workspaces/DEFAULT/mapper-image/', 'mapper-image/', false);
        archive.finalize();
    });
};

module.exports.createZipWithOutput = (uniqid, processorsLength) => {
    return new Promise((resolve, reject) => {
        const publicFolder = `./public/downloads/`;
        const folderPath = `./workspaces/${uniqid}`;

        // if (!fs.existsSync(folderPath)){
        //     fs.mkdirSync(folderPath);
        // }

        var output = file_system.createWriteStream(`${publicFolder}/${uniqid}.zip`);
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
                `${folderPath}/mapper-${index}/output`,
                `output-mapper-${index}`,
                false,
            );
        }
        //archive.directory('./workspaces/DEFAULT/mapper-image/', 'mapper-image/', false);
        archive.finalize();
    });
};
