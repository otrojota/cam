class ZBSNavTabs extends ZController {
    onThis_init() {
        console.log("crea ZBSNavTabs");
        $(this.view).on("shown.bs.tab", e => {
            let targetId = e.target.getAttribute("href");
            if (targetId && targetId.startsWith("#")) targetId = targetId.substr(1);
            this.triggerEvent("change", targetId);
        })
    }
}

ZVC.registerComponent("UL", e => (e.classList.contains("nav-tabs")), ZBSNavTabs);