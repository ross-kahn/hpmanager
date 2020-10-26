/**
 * Hooks up the character controller and establishes routes
 */
import express from "express";
import bodyParser from "body-parser";
import { Routes } from "../routes/routes";
import { CharacterController } from "../controllers/characterController";
import { ICharacterDBConnector, JSONCharacterConnector } from "../db/connection";

class App
{
    public app: express.Application;
    private _routes: Routes = new Routes();
    private _dbConnection: ICharacterDBConnector;
    private _characters: CharacterController;

    constructor()
    {
        this.app = express();
        this.__init();

        this._routes.route(this.app, this._characters);
    }

    private __init(): void
    {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));

        // Initialize the database and the controllers
        this._dbConnection = new JSONCharacterConnector();
        this._characters = new CharacterController(this._dbConnection);
    }

}
export default new App().app;