var file_system = require('fs');
var archiver = require('archiver');

module.exports.createZip = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;

    var output = file_system.createWriteStream(folderPath + '/workspace.zip');
    var archive = archiver('zip');
    
    output.on('close', function () {
        console.log('archiver has been finalized and the output file descriptor has closed.');
    });
    
    archive.on('error', function(err){
        throw err;
    });
    
    archive.pipe(output);
    
    archive.directory(folderPath, false);
    archive.directory('./workspaces/DEFAULT/mapper-image/', 'mapper-image/', false);
    archive.finalize();
}