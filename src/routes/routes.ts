/**
 * Defines routes, calls into appropriate behavior files
 */
import { CharacterController } from "../controllers/characterController";
import { Application, NextFunction, Request, Response } from "express";
import { join } from 'path';
import { Character, EDamageType } from "../models/character";

/**
 * 
 */
export class Routes
{
    public route(app: Application, characterController: CharacterController)
    {
        // Home page
        app.get("/", (req: Request, res: Response) =>
        {
            res.sendFile(join(process.cwd(), "/src/views/index.html"));
        });

        app.param("characterName", (req: Request, res: Response, next: NextFunction, characterName: string) =>
        {
            console.log("Character name param detected: " + characterName);
            let character: Character = characterController.LoadCharacterFromFile(req.params.characterName);
            if (!character)
            {
                let err: string = "ERROR: Character not found";
                console.log(err);
                return res.status(404).json({ message: err });
            }
            req.characterObj = character;
            next();
        });

        app.param("dmgType", (req: Request, res: Response, next: NextFunction, dmgType: string) =>
        {
            console.log("Damage type param detected: " + dmgType);
            if (!(<any>Object).values(EDamageType).includes(dmgType))
            {
                // Do stuff here
                console.log("ERROR: Undefined damage type: " + dmgType);
                return res.status(400).json({ message: "Error: Undefined damage type" });
            }
            req.damageType = <EDamageType>dmgType;
            next();
        });

        app.param("amount", (req: Request, res: Response, next: NextFunction, amount: number) =>
        {
            console.log("Amount param detected: " + amount);
            req.healthAmount = amount;
            next();
        });

        // Get full character data
        app.get("/api/characters/:characterName", (req: Request, res: Response) =>
        {
            let character: Character = req.characterObj;
            if (character) { res.status(200).json(JSON.stringify(character)); }
        });

        app.get("/api/characters/:characterName/health", (req: Request, res: Response) =>
        {
            let character: Character = req.characterObj;
            characterController.GetCharacterHealth(character);
            if (character) { res.status(200).json(JSON.stringify(character.health)); }
        });

        app.put("/api/damage/:characterName/type/:dmgType/amount/:amount", (req: Request, res: Response) =>
        {
            console.log("\n---- Damage request ---");
            console.log("Character name: " + req.characterObj?.name);
            console.log("Dmg type: " + req.damageType);
            console.log("Dmg amount: " + req.healthAmount);
            if (req.healthAmount < 0)
            {
                let err: string = "ERROR: Damage cannot be negative. Use the heal api instead."
                console.log(err);
                return res.status(400).json({ message: err });
            }

            let character: Character = req.characterObj;
            if (character) { res.status(200).json(JSON.stringify(character)); }
        });


        // Mismatch URL
        app.all('*', function (req: Request, res: Response)
        {
            res.status(404).send({ error: true, message: 'Check your URL please' });
        });

    }
}

declare global
{
    namespace Express
    {
        /**
         * This will allow us to use the app.param structure in a type safe way
         */
        export interface Request
        {
            characterObj: Character;
            damageType?: EDamageType;
            healthAmount: number;
        }
    }
}