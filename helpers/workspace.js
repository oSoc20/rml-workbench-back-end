const fs = require('fs');
const ncp = require('ncp').ncp;

module.exports.createWorkspace = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;
    ncp.limit = 16;

    if(!fs.existsSync(folderPath)){
        fs.mkdirSync(folderPath);

        ncp('./workspaces/DEFAULT', folderPath, 
            { filter: (path) => {
                    return !(path.indexOf("mapper-image")> -1)
                }
            }, function (err) {
            if (err) {
                return console.error(err);
            }
            console.log(`${folderPath} generated!`);
        }); 
    } else {
        console.log('Directory already exists');
    }
};

module.exports.createEmptyWorkspace = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;
    fs.mkdirSync(folderPath);
};

this.createWorkspace(123456);