const AbstractCamera = require("./AbstractCamera");

class ESCAM01 extends AbstractCamera {
    constructor(code, config) {
        super(code, config);
    }
}

module.exports = ESCAM01;