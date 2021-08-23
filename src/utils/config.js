const fs = require("fs");

function get_config(key = '')
{
    let dedocker_env = fs.readFileSync(__dirname+'/../dedocker-env.json' ,'utf-8');
    dedocker_env  = JSON.parse(dedocker_env);
    if (key) {
        return dedocker_env[key];
    }

    return dedocker_env;
}

function set_config(path, key = 'go_graphsplit_path')
{
    let dedocker_env = fs.readFileSync(__dirname+'/../dedocker-env.json' ,'utf-8');
    dedocker_env  = JSON.parse(dedocker_env);
    dedocker_env[key] = path;
    fs.writeFileSync(__dirname+'/../dedocker-env.json', JSON.stringify(dedocker_env))

    return dedocker_env;
}

module.exports = {
    get_config,
    set_config
}
