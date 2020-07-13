const fs = require('fs');
const Readable = require('stream').Readable;

module.exports.base64ToFile = function (base64, filename, path) {
    const buffer = Buffer.from(base64, 'base64');
    let stream = new Readable();

    stream.push(buffer);
    stream.push(null);
    stream.pipe(fs.createWriteStream(`./workspaces/${path}/${filename}`));
};
