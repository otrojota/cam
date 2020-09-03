class AbstractCamera {
    static createCamera(code, config) {
        switch (config.profile) {
            case "escam-01":
                return new (require("./escam-01"))(code, config);
            default:
                throw "Unsupported profile '" + config.profile + "'";
        }
    }

    constructor(code, config) {
        this.code = code;
        this.config = config;
    }

    get lat() {return this.config.lat}
    get lng() {return this.config.lng}
    get rotation() {return this.config.rotation}

    getPublicConfig() {
        return {
            code:this.code,
            lat:this.lat, lng:this.lng, rotation:this.rotation
        }
    }
}

module.exports = AbstractCamera;