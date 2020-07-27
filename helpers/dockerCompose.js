var file_system = require('fs');
var compose = require('docker-compose');

module.exports.editMapperDC = (uniqid, extension, mapperId) => {
    const filePath = `./workspaces/${uniqid}/processor-${mapperId}/docker-compose.yml`;
    const pattern = /output\.\w*/g;

    file_system.readFile(filePath, 'utf-8', function (err, data) {
        if (err) return console.log(err);

        var result = data.replace(pattern, `output.${extension}`);

        file_system.writeFileSync(filePath, result, 'utf-8', function (err) {
            if (err) return console.log(err);
        });

        if (data.indexOf('container_name') == -1)
            file_system.appendFileSync(filePath, `    container_name: '${uniqid}-${mapperId}'`);
    });
};

module.exports.run = (uniqid, extension, processorId) => {
    return new Promise((resolve, reject) => {
        const folderPath = `./workspaces/${uniqid}/processor-${processorId}`;

        compose.upAll({ cwd: folderPath, log: true }).then(
            () => {
                const watcher = file_system.watch(`${folderPath}/output`, (eventType, filename) => {
                    if (filename === `output.${extension}` && eventType === 'change') {
                        watcher.close();
                        resolve('Docker-compose completed!');
                    }
                });
            },
            (err) => {
                console.log('Something went wrong:', err);
                reject(err);
            },
        );
    });
};
