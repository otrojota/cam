const fs = require("fs");
const moment = require("moment-timezone");
const AbstractCamera = require("./AbstractCamera");
const express = require('express');

class ESCAM01 extends AbstractCamera {
    constructor(code, config) {
        super(code, config);
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
            let dayDir = t0.format("YYYY-M-D");
            try {
                let pics = await fs.promises.readdir(this.config.basePath + "/" + dayDir + "/picture");
                pics.forEach(fileName => {
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
                let vids = await fs.promises.readdir(this.config.basePath + "/" + dayDir + "/video");
                vids.forEach(fileName => {
                    if (fileName.endsWith(".avi") && (fileName.startsWith("T_") || fileName.startsWith("M_"))) {
                        let ff = fileName.substr(2);
                        ff = ff.substr(0, ff.length - 4);
                        try {
                            let t = moment.tz(ff, "YYYYMMDDHHmms", timeZone);
                            if (t.isBetween(t0, t1)) {
                                let isMotion = fileName.startsWith("M_");
                                if (isMotion) resume.hasMotion = true;
                                resume.events.push({
                                    type: "video",
                                    path: "/cam-img/" + this.code + "/" + dayDir + "/video/" + fileName,
                                    isMotion: isMotion,
                                    time: t.valueOf(),
                                    format:"video/avi"
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

            resume.events.sort((e1, e2) => (e1.time - e2.time));
            return resume;
        } catch(error) {
            throw error;
        }
    }
}

module.exports = ESCAM01;