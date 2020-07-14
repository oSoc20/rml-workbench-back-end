const fs = require('fs');
const ncp = require('ncp').ncp;

module.exports.createWorkspace = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;
    ncp.limit = 16;

    fs.mkdirSync(folderPath);

    ncp('./workspaces/DEFAULT/docker-compose.yml', folderPath, 
        { filter: (path) => {
                return !(path.indexOf("mapper-image")> -1)
            }
        }, function (err) {
        if (err) {
            return console.error(err);
        }
        console.log(`${folderPath} generated!`);
    });
};

module.exports.createEmptyWorkspace = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;
    fs.mkdirSync(folderPath);
};
