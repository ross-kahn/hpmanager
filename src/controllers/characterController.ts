import { Character, Health } from '../models/character'
import fs from 'fs';
import { join } from 'path';
import { HealthManager } from './healthManager';

const TEST_DIR: string = "/src/data/test/";
const DATA_DIR: string = "/src/data/";

export class CharacterController
{
    /**
     * Will attempt to load the persistent data file for a character into a local Character object.
     * If the data file is not found, will attempt to load a character from the test data directory.
     * @param filename The filename to load without any path or extension 
     */
    public LoadCharacterFromFile(filename: string): Character
    {
        let path: string;
        let newfile: boolean = false;
        if (fs.existsSync(join(this.__getDataDir(), filename + ".json")))
        {
            console.log("Loading existing character...");
            path = join(this.__getDataDir(), filename + ".json");
        }
        else if (fs.existsSync(join(this.__getTestDir(), filename + ".json")))
        {
            console.log("Loading new test character...");
            path = join(this.__getTestDir(), filename + ".json");
            newfile = true;
        }
        if (!path) { return null; }

        const rawData: string = fs.readFileSync(path, "utf8");
        let myChar: Character = this.__JSONtoCharacter(rawData);
        myChar.filename = filename;
        if (newfile) { this.SaveCharacterData(myChar); } // If loading from test directory, save down a persistent copy
        return myChar;
    }

    /**
     * Saves a character into a JSON file in the main data directory, with any current data
     * @param character Character object
     */
    public SaveCharacterData(character: Character)
    {
        fs.writeFile(this.__getCharacterFilename(character), JSON.stringify(character), () => { });
    }

    /**
     * Retrieves character's health information if it exists, or calculates it based on character
     * information. Triggers a save to the database.
     * @param character Character object
     */
    public GetCharacterHealth(character: Character): Health
    {
        let charHealth: Health = HealthManager.GetCharacterHealth(character);
        this.SaveCharacterData(character);
        return charHealth;
    }







    private __JSONtoCharacter(jsonStr: string): Character
    {
        let myChar: Character = JSON.parse(jsonStr, function (prop, value)
        {
            // Force property names to lowercase
            var lower = prop.toLowerCase();
            if (prop === lower) return value;
            else this[lower] = value;
        });
        return myChar;
    }

    private __getDataDir(): string
    {
        return join(process.cwd(), DATA_DIR);
    }

    private __getTestDir(): string
    {
        return process.cwd() + TEST_DIR;
    }

    private __getCharacterFilename(character: Character): string
    {
        let filename = character?.filename;
        if (!filename && character?.name)
        {
            filename = character.name.toLowerCase().split(" ").join("_");

        }
        if (!filename) { filename = "unnamed_character"; }

        return process.cwd() + DATA_DIR + filename + ".json";
    }

}