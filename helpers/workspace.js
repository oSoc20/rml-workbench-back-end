const fs = require('fs');
const ncp = require('ncp').ncp;

module.exports.createWorkspace = (uniqid, mapperId) => {
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
                    return console.error(err);
                }
                console.log(`${folderPath} generated!`);
            },
        );
    } else {
        console.log('Directory already exists');
    }
    return folderPath;
};

module.exports.createEmptyWorkspace = (uniqid) => {
    const folderPath = `./workspaces/${uniqid}`;
    fs.mkdirSync(folderPath);
};
