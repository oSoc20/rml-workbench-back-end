//npm
const express = require('express');
const app = express();
const morgan = require('morgan');
const uniqid = require('uniqid');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

// Home made
const dockerHelper = require('./helpers/dockerCompose');
const workspaceHelper = require('./helpers/workspace');
const zipHelper = require('./helpers/zip');

app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let routerV1 = express.Router();
app.use('/api/v1', routerV1);

routerV1.post('/create', (req, res) => {
    const token = uniqid();
    const downloadPath = `/download/${token}`;

    workspaceHelper.createEmptyWorkspace(token);
    handleRequest(req.body.processors, req.body.sources, token);
    handleDocker(req.body.download, req.body.execute, req.body.processors, token, downloadPath);
    res.json({ token, download: downloadPath });
});

routerV1.post('/update', (req, res) => {
    const token = req.body.token;
    workspaceHelper.deleteFolderRecursive(`./workspaces/${token}`);
    workspaceHelper.createEmptyWorkspace(token);
    handleRequest(req.body.processors, req.body.sources, token);
    handleDocker(req.body.download, req.body.execute, req.body.processors, token, downloadPath);
    res.json({ token, download: downloadPath });
});

app.get('/download/:id', (req, res) => {
    const file = `./public/downloads/${req.params.id}.zip`;
    if (fs.existsSync(file)) {
        res.download(file);
    } else {
        res.status(404).send('File is not ready yet.');
    }
});

function handleRequest(processors, sources, token) {
    workspaceHelper.deployWorkspace(processors, sources, token);
}

function handleDocker(download, execute, processors, token, downloadPath) {
    if (execute) {
        let dockerPromises = [];
        for (let index = 0; index < processors.length; index++) {
            dockerPromises.push(dockerHelper.run(token, processors[index].target, index));
        }

        Promise.all(dockerPromises)
            .then(() => {
                console.log(`Docker finished`);
                if (download) {
                    return zipHelper.createZip(token);
                } else {
                    return zipHelper.createZipWithOutput(token, processors.length);
                }
            })
            .then(() => {
                io.to(token).emit('message', { type: 'success', content: downloadPath });
                console.log(`Normaly, it's ok ${token}`);
            })
            .catch((err) => {
                io.to(token).emit('message', { type: 'Error', content: err });
                console.error(err);
            });
    } else {
        if (download) {
            zipHelper
                .createZip(token)
                .then(() =>
                    io.to(token).emit('message', { type: 'success', content: downloadPath }),
                )
                .catch((err) => {
                    io.to(token).emit('message', { type: 'Error', content: err });
                    console.error(err);
                });
        }
    }
}

const server = app.listen(8080, () => console.log('Started on port 8080'));
const io = require('socket.io').listen(server);

io.sockets.on('connection', (socket) => {
    socket.on('room', (room) => {
        console.log(room['id']);
        socket.join(room['id']);
    });
});
