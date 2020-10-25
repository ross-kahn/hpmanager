/**
 * Defines routes, calls into appropriate behavior files
 */
import { CharacterController } from "../controllers/characterController";
import { Application, request, Request, Response } from "express";
import bodyParser from "body-parser";
import { join } from 'path';
import { Character } from "../models/character";

export class Routes
{
    public route(app: Application, characterController: CharacterController)
    {
        // Home page
        app.get("/", (req: Request, res: Response) =>
        {
            res.sendFile(join(process.cwd(), "/src/views/index.html"));
        });

        // Get full character data
        app.get("/api/character/:characterName", (req: Request, res: Response) =>
        {
            let character: Character = characterController.LoadCharacterData(req.params.characterName);
            if (character) { res.status(200).json(JSON.stringify(character)); }
            else { res.status(404).json({ message: "Chracter not found" }); }
        });

        app.get("/api/character/:characterName", (req: Request, res: Response) =>
        {
            let character: Character = characterController.LoadCharacterData(req.params.characterName);
            if (character) { res.status(200).json(JSON.stringify(character)); }
            else { res.status(404).json({ message: "Chracter not found" }); }
        });

        app.get("/api/character/:characterName/health", (req: Request, res: Response) =>
        {
            let character: Character = characterController.LoadCharacterData(req.params.characterName);
            characterController.GetCharacterHealth(character);
            if (character) { res.status(200).json(JSON.stringify(character.health)); }
            else { res.status(404).json({ message: "Chracter not found" }); }
        });


        // Mismatch URL
        app.all('*', function (req: Request, res: Response)
        {
            res.status(404).send({ error: true, message: 'Check your URL please' });
        });

    }
}