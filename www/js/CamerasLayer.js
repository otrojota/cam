class CamerasVisualizer extends KonvaLeafletVisualizer {
    constructor(options) {
        super(options);
        this.cameras = [];
    }

    setCameras(cams) {
        this.cameras = cams;
        if (this.stageLayer) this.update();
    }

    getCameraElements(camera) {
        let p = this.toCanvas({lat:camera.lat, lng:camera.lng});
        let elements = [];
        let opts = {radius:9, fill:"red", stroke:"black", strokeWidth:1};
        opts.x = p.x; opts.y = p.y;
        let element =  new Konva.Circle(opts);
        elements.push(element);
        return elements;
    }
    update() {
        this.konvaLayer.destroyChildren();
        this.cameras.forEach(p => {
            let elements = this.getCameraElements(p);
            elements.forEach(e => this.konvaLayer.add(e))            
        })
        this.konvaLayer.draw()
        super.update();
    }
}