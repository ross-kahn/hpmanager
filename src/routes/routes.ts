/**
 * Defines routes, calls into appropriate behavior files
 */
import { CharacterController } from "../controllers/characterController";
import { Application, NextFunction, Request, Response } from "express";
import { join } from 'path';
import { Character, EDamageType } from "../models/character";

/**
 * Application routes
 */
export class Routes
{
    public route(app: Application, characterController: CharacterController)
    {
        // Home page readme
        app.get("/", (req: Request, res: Response) =>
        {
            res.status(200).sendFile(join(process.cwd(), "README.txt"));
        });

        // ***************************************
        // Parameter validations
        // ***************************************
        app.param("characterName", (req: Request, res: Response, next: NextFunction, characterName: string) =>
        {
            let character: Character = characterController.LoadCharacterFromDatabase(req.params.characterName);
            if (!character)
            {
                let err: string = "ERROR: Character not found";
                console.log(err);
                return res.status(404).send({ error: true, message: err });
            }
            req.characterObj = character;
            next();
        });

        app.param("dmgType", (req: Request, res: Response, next: NextFunction, dmgType: string) =>
        {
            if (!(<any>Object).values(EDamageType).includes(dmgType))
            {
                // Do stuff here
                console.log("ERROR: Undefined damage type: " + dmgType);
                return res.status(400).send({ error: true, message: "Error: Undefined damage type" });
            }
            req.damageType = <EDamageType>dmgType;
            next();
        });

        app.param("amount", (req: Request, res: Response, next: NextFunction, amount: number) =>
        {
            req.healthAmount = Number(amount);
            next();
        });


        // ***************************************
        // Routes
        // ***************************************
        /**
         * See full character sheet
         */
        app.get("/api/characters/:characterName", (req: Request, res: Response) =>
        {
            let character: Character = req.characterObj;
            if (character) { res.status(200).send(character); }
        });

        /**
         * Create a new character on the database with JSON
         */
        app.post("/api/characters/create/:newCharacterID", (req: Request, res: Response) =>
        {
            let newChar: Character = characterController.CreateNewCharacter(req.params.newCharacterID, JSON.stringify(req.body));
            if (newChar)
            {
                console.log("\nNew character created: " + newChar.name);
                console.log(newChar);
                res.status(201).send(newChar);
            }
            else
            {
                res.status(400).send({ error: true, message: "Could not create new character" });
            }
        });


        /**
         * Damage a character
         */
        app.put("/api/damage/:characterName/type/:dmgType/amount/:amount", (req: Request, res: Response) =>
        {
            if (req.healthAmount < 0)
            {
                let err: string = "ERROR: Damage cannot be negative. Use the heal api instead."
                console.log(err);
                return res.status(400).json({ message: err });
            }

            let character: Character = req.characterObj;
            characterController.DamageCharacter(character, req.damageType, req.healthAmount);
            return res.status(200).send(character);
        });

        /**
         * Heal a character
         */
        app.put("/api/heal/:characterName/amount/:amount", (req: Request, res: Response) =>
        {
            if (req.healthAmount < 0)
            {
                let err: string = "ERROR: Healing cannot be negative. Use the damage api instead."
                console.log(err);
                return res.status(400).json({ message: err });
            }

            let character: Character = req.characterObj;
            characterController.HealCharacter(character, req.healthAmount);
            return res.status(200).send(character);
        });


        /**
         * Put temporary HP on a character
         */
        app.put("/api/temphp/:characterName/amount/:amount", (req: Request, res: Response) =>
        {
            if (req.healthAmount < 0)
            {
                let err: string = "ERROR: TempHP cannot be negative. Use the damage api instead."
                console.log(err);
                return res.status(400).json({ message: err });
            }

            let character: Character = req.characterObj;
            characterController.GiveTempHP(character, req.healthAmount);
            return res.status(200).send(character);
        });


        app.get("/api/test", (req: Request, res: Response) =>
        {
            if (characterController.TestCharacter())
            {
                return res.status(200).json({ message: "Tests ran successfully!" });
            } else
            {
                return res.status(400).json({ error: true, message: "Tests failed" });
            }
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