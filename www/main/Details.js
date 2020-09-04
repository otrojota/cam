class Details extends ZCustomController {
    onThis_init() {
        this.timeZone = moment.tz.guess();
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

    applyFilters() {
        let events = this.resume.events;
        if (!this.edScheduled.checked) events = events.filter(e =>(e.isMotion))
        if (!this.edMotion.checked) events = events.filter(e => (!e.isMotion))
        if (!this.edImages.checked) events = events.filter(e => (e.type != "image"))
        if (!this.edVideos.checked) events = events.filter(e => (e.type != "video"))
        this.events = events;
        this.eventIndex = 0;
        this.refreshContent();
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
        if (!this.events.length) {
            this.img.show();
            this.video.hide();
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

        if (this.eventIndex > 0) this.cmdPrev.removeClass("text-muted");
        else this.cmdPrev.addClass("text-muted");

        if (this.eventIndex < (this.events.length - 1)) this.cmdNext.removeClass("text-muted");
        else this.cmdNext.addClass("text-muted");

        if (event.type == "image") {
            this.img.show();
            this.video.hide();
            this.img.view.setAttribute("src", event.path);
        } else {
            this.img.hide();
            this.video.show();
            this.video.view.innerHTML = `
                <video class"w-100" autoplay>
                    <source src="${event.path}" type="${event.format}">
                    <P>The video can't be played on this browser.</P>
                </video>`;
        }
    }
}
ZVC.export(Details);