const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const progressStream = require('progress-stream');
const ProgressBar = require('./progress-bar');

function download(fileURL) {
    return new Promise(function(resolve, reject) {
        // let fileSavePath = path.join("/tmp", path.basename(fileURL));
        let fileSavePath = path.join("/tmp", Date.now()+'.rar');
        const fileStream = fs.createWriteStream(fileSavePath).on('error', function (e) {
            console.error('error==>', e)
        }).on('ready', function () {
            console.log("loading");
        }).on('finish', function () {
            console.log("\n success");
            resolve(fileSavePath);
        });
        fetch(fileURL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/octet-stream' },
        }).then(res => {
            let fsize = res.headers.get("content-length");
            let str = progressStream({
                length: fsize,
                time: 100 /* ms */
            });
            let pb = new ProgressBar('loading', 50);
            str.on('progress', function (progressData) {
                let percentage = Math.round(progressData.percentage);
                pb.render({ completed: percentage, total: 100 });
            });
            res.body.pipe(str).pipe(fileStream);

        }).catch(e => {
            reject(e)
        });
    });

}

module.exports = download;
