class Main extends ZCustomController {
    onMainLoader_login(sesion) {
        window.login = sesion.login;
        this.mainLoader.load("./main/Mapa")
    }
}

ZVC.export(Main);