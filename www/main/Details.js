class Details extends ZCustomController {
    onThis_init() {
        this.timeZone = moment.tz.guess();
        this.konvaStage = new Konva.Stage({
            container:this.timeLine.view,
            width:this.timeLine.view.innerWidth,
            height:this.timeLine.view.innerHeight
        })
        this.konvaLayer = new Konva.Layer();
        this.konvaStage.add(this.konvaLayer);
        this.imgNoVideo = new Image(16, 16);
        this.imgNoVideo.src = "img/no-video.png";
        this.imgPicMotion = new Image(16, 16);
        this.imgPicMotion.src = "img/motion-sensor.png";
        this.imgPicNoMotion = new Image(16, 16);
        this.imgPicNoMotion.src = "img/no-motion.png";
        this.detailsContent.hide();

        this.panzoom = Panzoom(this.img.view);
        this.img.view.parentElement.addEventListener('wheel', this.panzoom.zoomWithWheel)
        window.addEventListener("resize", _ => this.paintTimeLine(100));
    }
    onCmdClose_click() {
        this.triggerEvent("close");   
        this.detailsContent.hide();
    }
    refresh(resume) {
        setTimeout(_ => this.detailsContent.show(), 300);
        this.resume = resume;
        this.cameraName.text = resume.cameraCode + " - " + moment.tz(resume.t0, this.timeZone).format("DD/MMM/YYYY");
        this.range.text = moment.tz(resume.t0, this.timeZone).format("HH:mm") + " - " + moment.tz(resume.t1, this.timeZone).format("HH:mm");
        
        let nScheduled = resume.events.filter(e => (!e.isMotion)).length;
        this.find("#nScheduled").innerText = "[" + nScheduled + "]";
        let nMotion = resume.events.filter(e => (e.isMotion)).length;
        this.find("#nMotion").innerText = "[" + nMotion + "]";

        let nImages = resume.events.filter(e => (e.type == "image")).length;
        this.find("#nImages").innerText = "[" + nImages + "]";
        let nVideos = resume.events.filter(e => (e.type == "video")).length;
        this.find("#nVideos").innerText = "[" + nVideos + "]";

        this.applyFilters()
    }

    onEdScheduled_change() {this.applyFilters()}
    onEdMotion_change() {this.applyFilters()}
    onEdImages_change() {this.applyFilters()}
    onEdVideos_change() {this.applyFilters()}

    applyFilters(keepSelection) {
        let events = this.resume.events;
        if (!this.edScheduled.checked) events = events.filter(e =>(e.isMotion))
        if (!this.edMotion.checked) events = events.filter(e => (!e.isMotion))
        if (!this.edImages.checked) events = events.filter(e => (e.type != "image"))
        if (!this.edVideos.checked) events = events.filter(e => (e.type != "video"))
        this.events = events;
        if (!keepSelection) {
            this.eventIndex = 0;
            this.refreshContent();
        }
    }

    onCmdNext_click() {
        if (!this.events || !this.events.length || this.eventIndex >= (this.events.length - 1)) return;
        this.eventIndex ++;
        this.refreshContent();
    }
    onCmdPrev_click() {
        if (!this.events || !this.events.length || this.eventIndex == 0) return;
        this.eventIndex --;
        this.refreshContent();
    }

    refreshContent() {
        this.paintTimeLine();
        if (!this.events.length) {
            this.img.show();
            this.video.hide();
            this.pending.hide();
            this.img.view.setAttribute("src", "img/no-image.png");
            this.find("#imgTime").innerText = "No hay Imagen";
            this.imgNumber.text = "0/0";
            this.imgMotion.hide();
            this.cmdPrev.addClass("text-muted");
            this.cmdNext.addClass("text-muted");
            return;
        }
        let event = this.events[this.eventIndex];
        this.find("#imgTime").innerText = moment.tz(event.time, this.timeZone).format("HH:mm:ss");        
        this.imgNumber.text = (this.eventIndex + 1) +  "/" + this.events.length;

        if (event.isMotion) this.imgMotion.show();
        else this.imgMotion.hide();
        if (event.type == "image") {
            this.panzoom.reset();
            this.imgType.removeClass("fa-video");
            this.imgType.addClass("fa-camera-retro");
        } else {
            this.imgType.removeClass("fa-camera-retro");
            this.imgType.addClass("fa-video");
        }

        if (this.eventIndex > 0) this.cmdPrev.removeClass("text-muted");
        else this.cmdPrev.addClass("text-muted");

        if (this.eventIndex < (this.events.length - 1)) this.cmdNext.removeClass("text-muted");
        else this.cmdNext.addClass("text-muted");

        if (event.type == "image") {
            this.img.show();
            this.video.hide();
            this.pending.hide();
            this.img.view.setAttribute("src", event.path);
        } else {
            this.img.hide();
            if (event.pending) {
                this.video.hide();
                this.pending.show();
            } else {
                this.video.show();
                this.pending.hide();
                this.video.view.innerHTML = `
                    <video controls style="max-width: 100%;">
                        <source src="${event.path}" type="${event.format}">
                        <P>The video can't be played on this browser.</P>
                    </video>`;
            }
        }
    }
    async refreshCurrentContent() {
        this.resume = await zPost("getCameraEvents.cam", {cameraCode:this.resume.cameraCode, fromTime:this.resume.t0, toTime:this.resume.t1});
        this.applyFilters(true);
        this.paintTimeLine();
        let event = this.events[this.eventIndex];
        this.find("#imgTime").innerText = moment.tz(event.time, this.timeZone).format("HH:mm:ss");        
        this.imgNumber.text = (this.eventIndex + 1) +  "/" + this.events.length;

        if (this.eventIndex > 0) this.cmdPrev.removeClass("text-muted");
        else this.cmdPrev.addClass("text-muted");

        if (this.eventIndex < (this.events.length - 1)) this.cmdNext.removeClass("text-muted");
        else this.cmdNext.addClass("text-muted");

        if (event.type == "image") {
            this.img.show();
            this.video.hide();
            this.pending.hide();
            this.img.view.setAttribute("src", event.path);
        } else {
            this.img.hide();
            if (event.pending) {
                this.video.hide();
                this.pending.show();
            } else {
                this.video.show();
                this.pending.hide();
                this.video.view.innerHTML = `
                    <video controls style="max-width: 100%;">
                        <source src="${event.path}" type="${event.format}">
                        <P>The video can't be played on this browser.</P>
                    </video>`;
            }
        }
    }
    async onCmdReload_click() {
        try {
            this.cmdReload.disable();
            this.notCamera.removeClass("fa-video-slash");
            this.notCamera.addClass("fa-spin");
            this.notCamera.addClass("fa-spinner");
            await this.refreshCurrentContent();
        } finally {
            this.cmdReload.enable();
            this.notCamera.removeClass("fa-spin");
            this.notCamera.removeClass("fa-spinner");
            this.notCamera.addClass("fa-video-slash");
        }
    }

    paintTimeLine(delay) {        
        // Wait for panel to show
        if (!delay) delay = 300;
        setTimeout(_ => {
            let w = this.timeLine.view.offsetWidth, h = this.timeLine.view.offsetHeight;
            let t0 = this.resume.t0.valueOf();
            let t1 = this.resume.t1.valueOf();
            this.konvaStage.width(w);
            this.konvaStage.height(h);
            this.konvaLayer.destroyChildren();
            let background = new Konva.Rect({
                x:0, y:0, width:this.konvaStage.width(), height:this.konvaStage.height(),
                fill:"rgb(60, 60, 60)", stroke:"white", strokeWidth:1
            })
            this.konvaLayer.add(background);
            if (this.events && this.events.length) {
                let nowOpts = {fill:"rgb(220,220,220)", stroke:"black", strokeWidth:1}
                let e = this.events[this.eventIndex];
                if (e.type == "image" || e.pending) {
                    nowOpts.x = (e.time - t0) / (t1 - t0) * w - 2;
                    nowOpts.width = 4;
                } else {
                    nowOpts.x = (e.time - t0) / (t1 - t0) * w;
                    nowOpts.width = e.metadata.duration * 1000 / (t1 - t0) * w;
                }
                nowOpts.y = 2;
                nowOpts.height = 36;
                this.konvaLayer.add(new Konva.Rect(nowOpts));
                this.events.filter(e => (e.type == "video")).forEach(event => {
                    let x = (event.time - t0) / (t1 - t0) * w;
                    if (event.pending) {
                        this.konvaLayer.add(new Konva.Image({
                            x: x - 8, y: 12, width:16, height:16, image:this.imgNoVideo
                        }));
                    } else {
                        let vw = event.metadata.duration * 1000 / (t1 - t0) * w;
                        let fill = event.isMotion?"red":"green";
                        this.konvaLayer.add(new Konva.Rect({
                            x:x, y:20, width:vw, height: 14, fill:fill, stroke:"black", strokeWidth:1
                        }))
                    }
                });
                this.events.filter(e => (e.type == "image")).forEach(event => {
                    let x = (event.time - t0) / (t1 - t0) * w - 6;
                    let fill = event.isMotion?"red":"green";
                    this.konvaLayer.add(new Konva.Circle({
                        x:x, y:12, radius:6, fill:fill, stroke:"white", strokeWidth:1
                    }))
                });
            }
    
            this.konvaLayer.draw();
        }, 300);
    }
}
ZVC.export(Details);