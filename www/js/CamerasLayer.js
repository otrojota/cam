class CamerasVisualizer extends KonvaLeafletVisualizer {
    constructor(options) {
        super(options);
        this.cameras = [];
    }

    setCameras(cams) {
        this.cameras = cams;
        if (this.stageLayer) this.update();
    }

    setResume(resume) {
        this.resume = resume;
        if (this.stageLayer) this.update();
    }

    getCameraElements(camera) {
        let p = this.toCanvas({lat:camera.lat, lng:camera.lng});
        let elements = [];
        
        let arc = new Konva.Arc({
            angle:60, x:p.x, y:p.y,            
            innerRadius:9, outerRadius:25,
            opacity:1,
            fillRadialGradientStartPoint: { x: 0, y: 0 },
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndPoint: { x: 0, y: 0 },
            fillRadialGradientEndRadius: 25,
            fillRadialGradientColorStops: [0, 'red', 0.8, 'yellow', 1, 'gray']
        })
        arc.rotate(-90 - 30 + camera.rotation);
        elements.push(arc);        

        let opts = {radius:9, stroke:"black", strokeWidth:1};
        opts.x = p.x; opts.y = p.y;
        let cameraResume = null;
        if (this.resume && this.resume[camera.code] && this.resume[camera.code].events.length) {
            opts.fill = this.resume[camera.code].hasMotion?"red":"green"
            cameraResume = this.resume[camera.code];
        }
        let circle =  new Konva.Circle(opts);
        elements.push(circle);
        circle.on("tap mouseup", _ => {
            if (this.options.onCameraClick) this.options.onCameraClick(cameraResume);
        })
        arc.on("tap mouseup", _ => {
            if (this.options.onCameraClick) this.options.onCameraClick(cameraResume);
        })
        circle.on('mouseleave', _ => {
            this.stageLayer.konvaStage.container().style.removeProperty("cursor");
        });

        circle.on('mouseenter', _ => {
            this.stageLayer.konvaStage.container().style.cursor = 'crosshair';
        });

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