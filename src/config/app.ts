/**
 * Hooks up the character controller and establishes routes
 */
import express from "express";
import bodyParser from "body-parser";
import { Routes } from "../routes/routes";
import { JSONCharacterController, ICharacterController } from "../controllers/characterController";

class App
{
    public app: express.Application;
    private routes: Routes = new Routes();
    private characters: ICharacterController = new JSONCharacterController();

    constructor()
    {
        this.app = express();
        this.__init();
        this.routes.route(this.app, this.characters);
    }

    private __init(): void
    {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
    }

}
export default new App().app;