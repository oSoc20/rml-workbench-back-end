//npm
const express = require('express');
const app = express();
const morgan = require('morgan');
const uniqid = require('uniqid');
const bodyParser = require('body-parser');
// Home made
const b64helper = require('./helpers/base64');
const workspaceHelper = require('./helpers/workspace');
const dockerHelper = require('./helpers/dockerCompose');
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
        let id = 0;
        let dockerPromises = new Array();

        processors.forEach((processor) => {
            workspaceHelper
                .createWorkspace(token, id)
                .then((mapperFolder) => {
                    //inputs
                    for (source of processor.sources) {
                        b64helper.base64ToFile(sources[source], source, `${mapperFolder}/input`);
                    }

                    //mapper-config
                    b64helper.base64ToFile(
                        processor.config,
                        'mapping.rml.ttl',
                        `${mapperFolder}/mapper-config`,
                    );

                    dockerHelper.editDC(token, processor.target, id);
                })
                .catch((err) => console.error(err))
                .finally(() => {
                    if (execute) {
                        dockerPromises.push(dockerHelper.run(token, id));
                    }
                    id++;
                });
        });

        if (execute) {
            Promise.all(dockerPromises)
                .then(() => {
                    if (download) return zipHelper.createZip(token);
                    else return zipHelper.createZip(token); //TODO
                })
                .then(() => {
                    resolve(`/workspaces/${token}/workspace.zip`);
                })
                .catch((err) => reject(err));
        } else {
            if (download) {
                zipHelper
                    .createZip(token)
                    .then(() => resolve(`/workspaces/${token}/workspace.zip`))
                    .catch((err) => reject(err));
            }
        }
    });
}

app.listen(8080, () => console.log('Started on port 8080'));
