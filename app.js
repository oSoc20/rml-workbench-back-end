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

let workspacesToRun = [];

routerV1.post('/create', (req, res) => {
    const token = uniqid();
    const downloadPath = `/download/${token}`;

    workspaceHelper.createEmptyWorkspace(token);
    handleRequest(
        req.body.download,
        req.body.execute,
        req.body.processors,
        req.body.sources,
        token,
    );
    res.json({ token, download: downloadPath });
});

routerV1.post('/update', (req, res) => {
    const token = req.body.token;

    workspaceHelper.deleteFolderRecursive(`./workspaces/${token}`);
    workspaceHelper.createEmptyWorkspace(token);
    handleRequest(
        req.body.download,
        req.body.execute,
        req.body.processors,
        req.body.sources,
        token,
    );
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

function handleRequest(download, execute, processors, sources, token) {
    workspaceHelper.deployWorkspace(processors, sources, token);
    workspacesToRun.push({ download, execute, processors, token });
}

function handleDocker() {
    console.log('Running handleDocker');
    workspacesToRun.forEach((workspace) => {
        const downloadPath = `/download/${workspace.token}`;
        console.log(`Running ${workspace.token}`);

        if (workspace.execute) {
            let dockerPromises = [];
            for (let index = 0; index < workspace.processors.length; index++) {
                dockerPromises.push(
                    dockerHelper.run(workspace.token, workspace.processors[index].target, index),
                );
            }

            Promise.all(dockerPromises)
                .then(() => {
                    console.log(`Dockers finished`);
                    if (workspace.download) {
                        return zipHelper.createZip(workspace.token);
                    } else {
                        return zipHelper.createZipWithOutput(
                            workspace.token,
                            workspace.processors.length,
                        );
                    }
                })
                .then(() => {
                    io.to(workspace.token).emit('message', {
                        type: 'success',
                        content: downloadPath,
                    });
                    console.log('Message execute emitted');
                })
                .catch((err) => {
                    io.to(workspace.token).emit('message', { type: 'Error', content: err });
                    console.error(err);
                });
        } else {
            if (workspace.download) {
                zipHelper
                    .createZip(workspace.token)
                    .then(
                        () =>
                            io
                                .to(workspace.token)
                                .emit('message', { type: 'success', content: downloadPath }),
                        console.log('Message download emitted'),
                    )
                    .catch((err) => {
                        io.to(workspace.token).emit('message', { type: 'Error', content: err });
                        console.error(err);
                    });
            }
        }
        workspacesToRun.shift();
    });
    console.log('Ending handleDocker');
}

const server = app.listen(8080, () => console.log('Started on port 8080'));
const io = require('socket.io').listen(server);

io.sockets.on('connection', (socket) => {
    socket.on('room', (room) => {
        console.log(room['id']);
        socket.join(room['id']);
    });
});

setInterval(handleDocker, 5000);
