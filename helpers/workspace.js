const fs = require('fs');
const ncp = require('ncp').ncp;

module.exports.createWorkspace = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;
    ncp.limit = 16;

    fs.mkdirSync(folderPath);

    ncp('./workspaces/DEFAULT', folderPath, function (err) {
        if (err) {
            return console.error(err);
        }
        console.log(`${folderPath} generated!`);
    });
};
