//npm
const express = require('express');
const app = express();
const morgan = require('morgan');
const uniqid = require('uniqid');
const bodyParser = require('body-parser');
const cors = require('cors');

// Home made
const dockerHelper = require('./helpers/dockerCompose');
const workspaceHelper = require('./helpers/workspace');
const zipHelper = require('./helpers/zip');

let corsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
};

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

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
    const token = req.body.token;
    workspaceHelper.deleteFolderRecursive(`./workspaces/${token}`);
    workspaceHelper.createEmptyWorkspace(token);
    handleRequest(req.body.download, req.body.execute, req.body.processors, req.body.sources, token)
        .then((path) => {
            res.json({ token, download: path });
        })
        .catch((err) => {
            res.json({ token, error: err });
        });
});

app.get('/download/:id', (req, res) => {
    const file = `./public/downloads/${req.params.id}.zip`;
    res.download(file);
});

function handleRequest(download, execute, processors, sources, token) {
    return new Promise((resolve, reject) => {
        let dockerPromises = [];
        const downloadPath = `/download/${token}`;

        workspaceHelper.deployWorkspace(processors, sources, token, execute);

        if (execute) {
            for (let index = 0; index < processors.length; index++) {
                dockerPromises.push(dockerHelper.run(token, processors[index].target, index));
            }

            Promise.all(dockerPromises)
                .then(() => {
                    if (download) {
                        return zipHelper.createZip(token);
                    } else {
                        return zipHelper.createZipWithOutput(token, processors.length);
                    }
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
