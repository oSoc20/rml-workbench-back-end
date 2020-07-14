var file_system = require('fs');

module.exports.editDC = (uniqid, extension) => {
    const filePath = `./workspaces/${uniqid}/docker-compose.yml`;
    const pattern = /(output.)\w+/g;

    file_system.readFile(filePath, 'utf-8', function(err, data){
        if (err)
            return console.log(err);
        
        var result = data.replace(pattern, `output.${extension}`);

        

        file_system.writeFileSync(filePath, result, 'utf8', function(err){
            if (err) return console.log(err)
        });

        if(data.indexOf('container_name') == -1)
            file_system.appendFileSync(filePath, `container_name: ${uniqid}`);
    })
}