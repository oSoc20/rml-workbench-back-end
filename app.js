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
    workspaceHelper.createEmptyWorkspace(token);
    handleRequest(req.body.download, req.body.execute, req.body.processors, req.body.sources, token)
        .then((path) => {
            res.json({ token, download: path });
            io.to(token).emit('message', { type: 'success', content: path });
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
    if (fs.existsSync(file)) {
        res.download(file);
    } else {
        res.status(404).send('File is not ready yet.');
    }
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
                    io.to(token).emit('message', { type: 'success', content: downloadPath });
                })
                .catch((err) => io.to(token).emit('message', { type: 'Error', content: err }));
        } else {
            if (download) {
                zipHelper
                    .createZip(token)
                    .then(() =>
                        io.to(token).emit('message', { type: 'success', content: downloadPath }),
                    )
                    .catch((err) => io.to(token).emit('message', { type: 'Error', content: err }));
            }
        }
        resolve(downloadPath);
    });
}

const server = app.listen(8080, () => console.log('Started on port 8080'));
const io = require('socket.io').listen(server);

io.sockets.on('connection', (socket) => {
    socket.on('room', (room) => {
        console.log(room['id']);
        socket.join(room['id']);
        io.to(token).emit('message', { type: 'success', content: path });
    });
});
