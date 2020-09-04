class Mapa extends ZCustomController {
    async onThis_init() {
        this.mapConfig = await zPost("getMapConfig.cam");
        this.cameras = await zPost("getCamerasConfig.cam");

        this.map = L.map("mapContainer", {
            minZoom:this.mapConfig.minZoom, 
            maxZoom:this.mapConfig.maxZoom
        }).setView([-33.034589, -71.592039], this.mapConfig.maxZoom);
        this.baseLayer = L.tileLayer(this.mapConfig.url, this.mapConfig.config);
        this.baseLayer.addTo(this.map);
        this.konvaLeafletLayer = new KonvaLeafletLayer(this.map, 200);
        this.konvaLeafletLayer.addTo(this.map);
        this.konvaLeafletLayer.addVisualizer("cameras", new CamerasVisualizer({
            onCameraClick:cameraResume => {
                if (cameraResume) this.openDetails(cameraResume);
            }
        }));
        this.konvaLeafletLayer.getVisualizer("cameras").setCameras(this.cameras);
        
        this.slider = noUiSlider.create(this.edHH.view, {
            start:0, range:{min:0, max:24*60/15 - 1}
        });
        this.slider.on("slide", e => this.mmChanged(e));
        $(this.view).bootstrapMaterialDesign();
        this.edNow.checked = true;
        this.setNow()
        this.refresh();
        setInterval(() => {
            if (this.isNow()) {
                this.setNow();
                this.refresh();
            }
        }, 30000);
        this.hideWorking();
        this.detailsOpen = false;
    }

    showWorking() {this.working.show()}
    hideWorking() {this.working.hide()}

    getDate() {
        let d = this.edDate.value;
        return moment.tz(d.getTime(), moment.tz.guess()).startOf("day");
    }

    isNow() {return this.edNow.checked}
    setNow() {        
        let now = moment.tz(moment.tz.guess());
        let startOfDay = now.clone().startOf("day");
        this.edDate.value = startOfDay;        
        let minutes = moment.duration(now.diff(startOfDay)).asMinutes();
        this.slider.set(minutes / 15);
    }

    onEdNow_change() {
        if (this.isNow()) this.setNow();
        this.refresh();
    }

    onEdDate_change() {
        this.edNow.checked = false;
        this.refresh();
    }

    mmChanged(e) {
        if (this.isNow()) this.edNow.checked = false;
        this.refresh();        
    }

    refresh() {
        let t0, t1;
        if (this.isNow()) {
            let now = moment.tz(moment.tz.guess());
            let nowMinus15 = now.clone().subtract(15, "minutes");
            this.lblRange.text = nowMinus15.format("HH:mm") + " - " + now.format("HH:mm");
            t0 = nowMinus15;
            t1 = now;
        } else {
            let mm0 = 15 * parseInt(this.slider.get())
            t0 = this.getDate().startOf("day").add(mm0, "minutes");
            t1 = t0.clone().add(15, "minutes");
        }
        this.lblRange.text = t0.format("HH:mm") + " - " + t1.format("HH:mm");
        this.callGetResume(t0, t1);
    }

    callGetResume(t0, t1) {
        if (this.timerResume) clearTimeout(this.timerResume);
        this.timerResume = setTimeout(_ => {
            this.timerResume = null;
            this.getResume(t0, t1)
        }, 300);
    }
    getResume(t0, t1) {
        this.showWorking();
        zPost("getEventsResume.cam", {fromTime:t0.valueOf(), toTime:t1.valueOf()}, resume => {
            this.konvaLeafletLayer.getVisualizer("cameras").setResume(resume);
            this.hideWorking();
            if (this.detailsOpen) {
                let cameraResume = resume[this.details.resume.cameraCode];
                this.details.refresh(cameraResume);
            }
        }, error => {
            console.error(error)
            this.hideWorking();
        })
    }

    openDetails(cameraResume) {
        this.details.refresh(cameraResume);
        this.details.addClass("details-pane-open");
        this.detailsOpen = true;
    }
    onDetails_close() {
        this.details.removeClass("details-pane-open");
        this.detailsOpen = false;
    }
}
ZVC.export(Mapa)