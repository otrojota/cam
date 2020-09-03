const fs = require("fs");
const HJSON = require("hjson");

class Config {
    static get instance() {
        if (Config.singleton) return Config.singleton;
        Config.singleton = new Config;
        return Config.singleton;
    }

    getConfig() {
        try {
            let stats = fs.statSync("/home/config/config.hjson");
            if (stats.mtime.getTime() != this.lastConfigTime) {
                let json = fs.readFileSync("/home/config/config.hjson").toString("utf-8");
                this._config = HJSON.parse(json);
                this.lastConfigTime = stats.mtime.getTime();
                require("./Cams").resetCache();
                return this._config;                        
            } else {
                return this._config
            }
        } catch(error) {
            console.error("Error reading /home/config/config.hjson", error);
            throw error;
        }
    }
    getMapConfig() {
        return this.getConfig().map;
    }    
}

module.exports = Config.instance;