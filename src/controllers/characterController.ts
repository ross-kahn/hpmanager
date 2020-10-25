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
     * @param characterID filename 
     */
    public LoadCharacterData(characterID: string): Character
    {
        let filename: string;
        let newfile: boolean = false;
        if (fs.existsSync(join(this.__getDataDir(), characterID + ".json")))
        {
            filename = join(this.__getDataDir(), characterID + ".json");
        }
        else if (fs.existsSync(join(this.__getTestDir(), characterID + ".json")))
        {
            filename = join(this.__getTestDir(), characterID + ".json");
            newfile = true;
        }
        if (!filename) { return null; }

        const rawData: string = fs.readFileSync(filename, "utf8");
        let myChar: Character = this.__JSONtoCharacter(rawData);
        myChar.filename = characterID;
        if (newfile) { this.SaveCharacterData(myChar); } // If loading from test directory, save down a persistent copy
        return myChar;
    }

    public SaveCharacterData(character: Character)
    {
        fs.writeFile(this.__getCharacterFilename(character), JSON.stringify(character), () => { });
    }

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