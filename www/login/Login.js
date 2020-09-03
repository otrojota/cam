class Login extends ZCustomController {
    async onThis_init() {
        $(this.view).bootstrapMaterialDesign();
        $(this.find("#wait")).hide();
        this.edLogin.view.onkeypress = e => { if (e.keyCode == 13) this.onCmdLogin_click() }
        this.edPwd.view.onkeypress = e => { if (e.keyCode == 13) this.onCmdLogin_click() }
        let sesion = window.localStorage.getItem("sesion");
        if (sesion) sesion = JSON.parse(sesion);
        if (sesion) {
            this.edLogin.value = sesion.login;
            this.edPwd.value = sesion.pwd;
        }
        setTimeout(_ => this.edLogin.view.focus(), 200);
    }

    onCmdLogin_click() {
        $(this.find("#noWait")).hide();
        $(this.find("#wait")).show();
        this.cmdLogin.disable();
        zPost("login.cam", { login: this.edLogin.value, pwd: this.edPwd.value }, _ => {
            let sesion = {login: this.edLogin.value, pwd: this.edPwd.value}
            window.localStorage.setItem("sesion", JSON.stringify(sesion));
            this.triggerEvent("login", sesion);
        }, error => {
            $(this.find("#noWait")).show();
            $(this.find("#wait")).hide();
            this.cmdLogin.enable();
            this.showDialog("common/WError", { message: error.toString() })
        })
    }

}
ZVC.export(Login);