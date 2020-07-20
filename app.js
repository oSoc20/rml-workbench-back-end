//npm
const express = require('express');
const app = express();
const morgan = require('morgan');
const uniqid = require('uniqid');
const bodyParser = require('body-parser');
// Home made
const dockerHelper = require('./helpers/dockerCompose');

const workspaceHelper = require('./helpers/workspace');
const zipHelper = require('./helpers/zip');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let routerV1 = express.Router();
app.use('/api/v1', routerV1);

routerV1.post('/create', (req, res) => {
    const token = uniqid();
    workspaceHelper.createEmptyWorkspace(token);
    handleRequest(req.body.download, req.body.execute, req.body.processors, req.body.sources, token)
        .then((path) => {
            res.json({ token, download: path });
        })
        .catch((err) => {
            res.json({ token, error: err });
        });
});

routerV1.post('/update', (req, res) => {
    // workspaceHelper.createWorkspace(token);
    // res.json({ token: token });
});

function handleRequest(download, execute, processors, sources, token) {
    return new Promise((resolve, reject) => {
        let dockerPromises = new Array();
        const downloadPath = `/public/downloads/${token}.zip`;

        workspaceHelper.deployWorkspace(processors, sources, token, execute);

        if (execute) {
            for (let index = 0; index < processors.length; index++) {
                dockerPromises.push(dockerHelper.run(token, processors[index].target, index));
            }

            Promise.all(dockerPromises)
                .then(() => {
                    if (download) return zipHelper.createZip(token);
                    else return zipHelper.createZipWithOutput(token, processors.length);
                })
                .then(() => {
                    resolve(downloadPath);
                })
                .catch((err) => reject(err));
        } else {
            if (download) {
                zipHelper
                    .createZip(token)
                    .then(() => resolve(downloadPath))
                    .catch((err) => reject(err));
            }
        }
    });
}

app.listen(8080, () => console.log('Started on port 8080'));
