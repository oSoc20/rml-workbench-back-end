//npm
const express = require('express');
const app = express();
const morgan = require('morgan');
const fs = require('fs');
const uniqid = require('uniqid');
const bodyParser = require('body-parser');
// Home made
const b64helper = require('./helpers/base64');
const workspaceHelper = require('./helpers/workspace');
const dockerHelper = require('./helpers/dockerCompose');

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let routerV1 = express.Router();
app.use('/api/v1', routerV1);

routerV1.post('/create', (req, res) => {
    const token = uniqid();
    workspaceHelper.createEmptyWorkspace(token);
    return handleRequest(req.body.output, req.body.processors, req.body.sources, token);
});

routerV1.post('/update', (req, res) => {
    // workspaceHelper.createWorkspace(token);
    // res.json({ token: token });
});

function handleRequest(output, processors, sources, token) {
    let id = 0;

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
                    'mapper-config.rml.ttl',
                    `${mapperFolder}/mapper-config`,
                );

                dockerHelper.editDC(token, processor.target, id);
            })
            .catch((err) => console.error(err))
            .finally(() => id++);
    });

    //TODO Check what the user want (processor['output'])
    //TODO Send the result
}

app.listen(8080, () => console.log('Started on port 8080'));
