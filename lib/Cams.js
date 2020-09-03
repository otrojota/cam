const ZModule = require("./z-server").ZModule;
const config = require("./Config");
const AbstractCamera = require("./profiles/AbstractCamera");

class Cams extends ZModule {
    static get instance() {
        if (Cams.singleton) return Cams.singleton;
        Cams.singleton = new Cams();
        return Cams.singleton;
    }

    resetCache() {
        this.cameras = null;
    }

    async login(login, pwd) {
        try {
            let conf = config.getConfig();
            let u = conf.users.find(u => u.login.toLowerCase() == login.toLowerCase());
            if (!u || pwd.toLowerCase() != u.pwd.toLowerCase()) throw "Usuario o Contraseña Inválidos"
        } catch (error) {
            throw error;
        }
    }

    getMapConfig() {return config.getMapConfig()}

    getCameras() {
        if (this.cameras) return this.cameras;
        let camsConfig = config.getConfig().cameras;
        this.cameras = Object.keys(camsConfig).reduce((list, camCode) => {
            list.push(AbstractCamera.createCamera(camCode, camsConfig[camCode]));
            return list;
        }, []);
        return this.cameras;
    }

    getCamerasConfig() {
        return this.getCameras().reduce((list, cam) => {
            list.push(cam.getPublicConfig());
            return list;
        }, [])
    }

}

module.exports = Cams.instance;