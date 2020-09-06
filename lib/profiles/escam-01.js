const fs = require("fs");
const moment = require("moment-timezone");
const AbstractCamera = require("./AbstractCamera");
const express = require('express');
const videoConverteer = require("../VideoConverter");
const configService = require("../Config");

class ESCAM01 extends AbstractCamera {
    constructor(code, config) {
        super(code, config);
        this.interval = setInterval(_ => this.convertDaemon(), 30000);
    }

    registerRoutes(app) {
        app.use("/cam-img/" + this.code, express.static(this.config.basePath));
    }

    async getEventsResume(t0, t1, timeZone) {
        let resume = {
            cameraCode:this.code,
            t0:t0.valueOf(), t1:t1.valueOf(),
            events:[],
            hasMotion:false
        }

        try {
            // Images
            let dayDir = t0.format("YYYY-M-D");
            let files;
            try {
                files = await fs.promises.readdir(this.config.basePath + "/" + dayDir + "/picture");
            } catch(error) {
                files = [];
            }
            try {
                files.forEach(fileName => {
                    if (fileName.endsWith(".jpg") && (fileName.startsWith("T_") || fileName.startsWith("M_"))) {
                        let ff = fileName.substr(2);
                        ff = ff.substr(0, ff.length - 4);
                        try {
                            let t = moment.tz(ff, "YYYYMMDDHHmms", timeZone);                            
                            if (t.isBetween(t0, t1)) {
                                let isMotion = fileName.startsWith("M_");
                                if (isMotion) resume.hasMotion = true;
                                resume.events.push({
                                    type: "image",
                                    path: "/cam-img/" + this.code + "/" + dayDir + "/picture/" + fileName,
                                    isMotion: isMotion,
                                    time: t.valueOf()
                                })
                            }
                        } catch(err) {
                            console.error(err);
                        }
                    }
                })
            } catch(error) {
                console.error(error)
            }

            try {
                files = await fs.promises.readdir(this.config.basePath + "/" + dayDir + "/video");
            } catch(error) {
                files = [];
            }
            // Converted Videos
            try {
                for await (let fileName of files) {
                    if (fileName.endsWith(".vmetadata")) {
                        let videoFilename = fileName.substr(0, fileName.length - 10);
                        let ff = videoFilename.substr(2);
                        ff = ff.substr(0, ff.length - 4);
                        try {
                            let t = moment.tz(ff, "YYYYMMDDHHmms", timeZone);
                            if (t.isBetween(t0, t1)) {
                                let vmetadata = await fs.promises.readFile(this.config.basePath + "/" + dayDir + "/video/" + fileName);
                                vmetadata = JSON.parse(vmetadata.toString("utf-8"));
                                let isMotion = videoFilename.startsWith("M_");
                                if (isMotion) resume.hasMotion = true;
                                let path = "/cam-img/" + this.code + "/" + dayDir + "/video/" + videoFilename;
                                resume.events.push({
                                    type: "video",
                                    path: path,
                                    isMotion: isMotion,
                                    time: t.valueOf(),
                                    format:"video/mp4",
                                    pending:false,
                                    metadata:vmetadata
                                })
                            }
                        } catch(err) {
                            console.error(err);
                        }
                    }
                }
            } catch(error) {
                console.error(error)
            }

            // Pending videos (TMP_*_TRANS_YYYYMMDDHHmmss.avi or TRANS_YYYYMMDDHHmmss.avi)
            // Send to conver (M_*.avi, T_*.avi)
            try {
                for await (let fileName of files) {
                    if (fileName.endsWith(".avi") && (fileName.startsWith("TMP_") || fileName.startsWith("TRANS_")  || fileName.startsWith("M_")  || fileName.startsWith("T_"))) {
                        let originalFileName;
                        if (fileName.startsWith("M_") || fileName.startsWith("T_")) {
                            originalFileName = fileName;
                            await videoConverteer.enqueueConversion(this.config.basePath + "/" + dayDir + "/video/" + fileName);
                        } else if (fileName.startsWith("TRANS_")) {
                            originalFileName = fileName.substr(6);
                            videoConverteer.ensureWatching(this.config.basePath + "/" + dayDir + "/video");
                        } else if (fileName.startsWith("TMP_")) {
                            let p = fileName.indexOf("_", 4);
                            originalFileName = fileName.substr(p+1);
                        }
                        let ff = originalFileName.substr(2);
                        ff = ff.substr(0, ff.length - 4);
                        try {
                            let t = moment.tz(ff, "YYYYMMDDHHmms", timeZone);
                            if (t.isBetween(t0, t1)) {
                                let isMotion = originalFileName.startsWith("M_");
                                if (isMotion) resume.hasMotion = true;
                                resume.events.push({
                                    type: "video",
                                    isMotion: isMotion,
                                    time: t.valueOf(),
                                    pending: true
                                })
                            }
                        } catch(err) {
                            console.error(err);
                        }
                    }
                }
            } catch(error) {
                console.error(error)
            }

            resume.events.sort((e1, e2) => (e1.time - e2.time));
            return resume;
        } catch(error) {
            throw error;
        }
    }

    async convertDaemon() {
        try {
            let timeZone = configService.getConfig().timeZone;
            let dayDir = (moment.tz(timeZone).subtract(5, "minutes")).format("YYYY-M-D");
            let dir = this.config.basePath + "/" + dayDir + "/video";
            let files = await fs.promises.readdir(dir);
            files = files.filter(f => (f.startsWith("M_") || f.startsWith("T_")) && f.endsWith(".avi"));
            if (files.length) {
                files.forEach(f => videoConverteer.enqueueConversion(dir + "/" + f));
            } else {
                videoConverteer.ensureWatching(dir);
            }
        } catch(error) {
            //console.error(error);
        }
    }

}

module.exports = ESCAM01;