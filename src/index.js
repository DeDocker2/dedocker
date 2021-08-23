#!/usr/bin/env node

const {program} = require('commander');
const {api_url} = require('./config/config');
const packageJson = require('../package.json')
const download = require('./utils/download')
const execShPromise = require("exec-sh").promise;
const Table = require('cli-table2');
const request = require('request');
const config = require('./utils/config');
const fs = require('fs');

let dedocker_config = config.get_config();

program
    .version(packageJson.version)
    .description('COMMAND eA self-sufficient runtime for containers');

program
    .command('pull')
    .argument('<image>', 'image url')
    .description('Pull an image or a repository from a registry')
    .action((image) => {
        if (!dedocker_config.go_graphsplit_path) {
            console.log('please set go_graphsplit_path')
            process.exit(1)
        }
        let image_tag = image.split(':')
        let db_image = image_tag[0]
        let tag = image_tag[1] ? image_tag[1] : 'latest';
        let url = api_url+`/v1/images?keyword=${db_image}&current=1&pageSize=20`;
        console.log('get image...')
        request(url, function (error, response, result) {
            if (!error && response.statusCode == 200) {
                let list = JSON.parse(result).data.list
                if (list.length <= 0) {
                    console.log('repository does not exist')
                    process.exit(1)
                }
                let db_image_info = list[0];
                let url = api_url+`/v1/tag?current=1&pageSize=1&keyword=${tag}&imageId=${db_image_info.id}`;
                console.log('get tag...')
                request(url,  function (error, response, result) {
                    if (!error && response.statusCode == 200) {
                        let tag = JSON.parse(result)['data']['list'][0];
                        if (!tag) {
                            console.log('repository does not exist')
                            process.exit(1)
                        }
                        let url = api_url+`/v1/deal/getDeal?payloadCid=${tag.payload_cid}`;
                        console.log('get deal...')
                        console.log(url)
                        request(url, async function (error, response, result) {
                            let deal = JSON.parse(result)['data'];
                            if (!deal) {
                                console.log('deal does not exist')
                                process.exit(1)
                            }
                            let lotus_cmd = `docker exec slingshot_lotus lotus client retrieve --miner ${deal.miner} ${deal.orderPayloadCid} ${tag['car_filename']}`
                            console.log(lotus_cmd)
                            await exec(lotus_cmd);
                            let fileURL = `/tmp/${tag['car_filename']}`;
                            let docker_cp_cmd = `docker cp slingshot_lotus:/${tag['car_filename']} ${fileURL}`;
                            await exec(docker_cp_cmd)
                            let graphsplit = config.get_config('go_graphsplit_path');
                            if (!graphsplit || graphsplit === '') {
                                graphsplit = __dirname+'/graphsplit'
                            }
                            let cmd = `${graphsplit} restore  --car-path=${fileURL} --output-dir=/tmp --parallel=2`;
                            console.log(cmd)
                            await exec(cmd);
                            let img_path = `/tmp/${db_image}/${tag['name']}/linux/amd64/${tag['image_filename']}`;
                            let import_cmd = 'docker load < '+img_path;
                            console.log(import_cmd)
                            await exec(import_cmd);
                            request({
                                url: api_url+`/v1/images/upDownLoadNum`,
                                method: "POST",
                                json: true,
                                headers: {
                                    "content-type": "application/json",
                                },
                                body: {"id":db_image_info.id}
                            }, function(error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    // console.log(body)
                                }
                                process.exit(1);
                            });
                        })
                    }
                });
            }
        });
    });

program
    .command('search')
    .argument('[image]', 'image url')
    .description('Search the DeDocker Hub for images')
    .action((image) => {
        if (!image) {
            return_result([])
            process.exit(1);
        }
        let url = api_url+`/v1/images?keyword=${image}&current=1&pageSize=20`;
        request(url, function (error, response, result) {
            if (!error && response.statusCode == 200) {
                console.log(JSON.parse(result).data.list)
                return_result(JSON.parse(result).data.list)
                process.exit(1);
            }
        });
    });

program
    .command('config')
    .description('Manage Docker configs')
    .option('-l, --list', 'show config set')
    .option('-s, --set_path <value>', 'set config')
    .action((opt) => {
        if (opt.list) {
            console.log(config.get_config());
            process.exit(1)
        }
        if (opt.set_path) {
            console.log(config.set_config(opt.set_path));
            process.exit(1)
        }
        console.log(opt);
        process.exit(1)
    });


function return_result($image_list = [])
{
    let table = new Table({
        head: ['NAME', 'DESCRIPTION', 'STARS', 'OFFICIAL'],
    });
    $image_list.forEach((v) => {
        let arr = [v['name'], v['description'], v['stars'], v['label'].indexOf('Official Image') >= 0 ? '[ok]' : ''];
        table.push(arr);
    })
    console.log(table.toString());
}

async function exec(cmd)
{
    try {
        const { stdout, stderr } = await execShPromise(cmd);
        console.log('stdout:', stdout, 'stderr:', stderr)
    } catch (error) {
        console.log('error', error)
    }
}


program.parse();
