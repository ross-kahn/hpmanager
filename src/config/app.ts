/**
 * Hooks up the database and establishes routes
 */
import express from "express";
import bodyParser from "body-parser";
import { Routes } from "../routes/routes";
import { CharacterController } from "../controllers/characterController";

class App
{
    public app: express.Application;
    private routes: Routes = new Routes();
    private characters: CharacterController = new CharacterController();

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