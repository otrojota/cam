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
            start:0, range:{min:0, max:24 * 2 - 1}
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
        this.slider.set(minutes / 30);
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
            let nowMinus30 = now.clone().subtract(30, "minutes");
            this.lblRange.text = nowMinus30.format("HH:mm") + " - " + now.format("HH:mm");
            t0 = nowMinus30;
            t1 = now;
        } else {
            let mm0 = parseInt(this.slider.get());
            t0 = this.getDate().startOf("day").add(mm0 * 30, "minutes");
            t1 = t0.clone().add(30, "minutes");
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
        }, error => {
            console.error(error)
            this.hideWorking();
        })
    }

    openDetails(cameraResume) {
        this.details.refresh(cameraResume);
        let w = this.view.offsetWidth;
        if (w < 400) this.details.addClass("details-pane-open");
        else if (w < 800) this.details.addClass("details-pane-open-half");
        else this.details.addClass("details-pane-open-wide");
        this.detailsOpen = true;
    }
    onDetails_close() {
        this.details.removeClass("details-pane-open");
        this.details.removeClass("details-pane-open-half");
        this.details.removeClass("details-pane-open-wide");
        this.detailsOpen = false;
    }
}
ZVC.export(Mapa)