const fs = require('fs');
const ncp = require('ncp').ncp;

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
