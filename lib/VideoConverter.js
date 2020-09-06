const fs = require("fs");
const MAX_WORKERS = 2;
const { exec } = require('child_process');

/*
ffmpeg -i M_20200903235932.avi -hide_banner -loglevel panic -y test.mp4
ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 test.mp4
*/

class VideoConverter {
    static get instance() {
        if (VideoConverter.singleton) return VideoConverter.singleton;
        VideoConverter.singleton = new VideoConverter();
        return VideoConverter.singleton;
    }

    constructor() {
        this.watchingDirs = {}
        this.nWorkers = 0;
    }

    fileExists(path) {
        return new Promise(resolve => {
            fs.access(path, fs.F_OK, err => {
                if (err) resolve(false);
                else resolve(true);
            })
        })
    }

    async enqueueConversion(path) {
        try {
            let p = path.lastIndexOf("/");
            let dir = path.substr(0, p);
            let name  = path.substr(p + 1);
            let enqueuedPath = dir + "/TRANS_" + name;
            let exists = await this.fileExists(enqueuedPath);
            if (!exists) {
                try {
                    fs.promises.rename(path, enqueuedPath);
                } catch(error) {}
            }
            this.ensureWatching(dir);
        } catch(error) {
            throw error;
        }
    } 

    ensureWatching(dir) {
        this.watchingDirs[dir] = true;
        this.pickWork();
    }
    async pickWork() {
        try {
            if (this.nWorkers >= MAX_WORKERS) return;
            let dirs = Object.keys(this.watchingDirs);
            if (!dirs.length) return;            
            let dir = dirs[0];
            let waitingFiles = await fs.promises.readdir(dir);
            waitingFiles = waitingFiles.filter(f => f.startsWith("TRANS_"));
            if (!waitingFiles || !waitingFiles.length) {
                delete this.watchingDirs[dir];
                this.pickWork();
                return;
            }
            let waitingFile = waitingFiles[0];
            if (this.nWorkers >= MAX_WORKERS) return;
            this.nWorkers ++;
            this.startWorker(dir, waitingFile);
        } catch(error) {
            console.error(error);
        }
    }

    exec(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, {maxBuffer:1024 * 1024}, (err, stdout, stderr) => {
                if (err) {
                    console.warn("Error converting video");
                    if (stderr) console.error(stderr);
                    if (stdout) console.log(stdout);
                    reject(err);
                    return;
                }
                if (stderr) {
                    reject(stderr);
                    return;
                }
                resolve(stdout);
            });
        })
    }

    async startWorker(dir, fileName) {
        try {
            // Move source to temporary file
            let tmpName = "TMP_" + parseInt(Math.random() * 9999) + "_" + fileName;
            await fs.promises.rename(dir + "/" + fileName, dir + "/" + tmpName);
            await (new Promise(resolve => setTimeout(_ => resolve(), 500)));
            // Remove TRANS_ from name and change extension to .mp4
            let dstName = fileName.substr(6);
            let p = dstName.lastIndexOf(".");
            dstName = dstName.substr(0, p) + ".mp4";
            // convert
            let cmd = `ffmpeg -i ${dir + "/" + tmpName} -hide_banner -loglevel panic -y ${dir + "/" + dstName}`;
            let n = 0, converted = false, lastError;
            let t0 = Date.now();
            do {
                console.log("converting video ...");
                try {
                    await this.exec(cmd);
                    converted = true;
                } catch(error) {
                    lastError = error;
                    n++;
                    console.warn("Error in attemp " + n + ": " + error);
                    await (new Promise(resolve => setTimeout(_ => resolve(), 15000)));
                }
            } while (!converted && n < 5)
            if (!converted) throw lastError;
            // calculate duration
            cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 ${dir + "/" + dstName}`;
            let secs = await this.exec(cmd);
            let vmetadata = {duration:parseFloat(secs)};
            await fs.promises.writeFile(dir + "/" + dstName + ".vmetadata", JSON.stringify(vmetadata));
            // remove source file
            await fs.promises.unlink(dir + "/" + tmpName);
            console.log("Video converted in " + ((Date.now() - t0) / 1000) + " secs.");
        } catch(error) {
            console.error(error);
        } finally {
            this.nWorkers --;
            // check for more work
            this.pickWork();             
        }
    }
}


module.exports = VideoConverter.instance;