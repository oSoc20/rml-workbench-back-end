var file_system = require('fs');
var archiver = require('archiver');

module.exports.createZip = (uniqid) => {
    return new Promise((resolve, reject) => {
        const folderPath = `./workspaces/${uniqid}`;

        var output = file_system.createWriteStream(`${folderPath}/workspace.zip`);
        var archive = archiver('zip');

        output.on('close', function () {
            console.log('archiver has been finalized and the output file descriptor has closed.');
            resolve();
        });

        archive.on('error', function (err) {
            reject(err);
        });

        archive.pipe(output);

        archive.directory(folderPath, false);
        archive.directory('./workspaces/DEFAULT/mapper-image/', 'mapper-image/', false);
        archive.finalize();
    });
};
