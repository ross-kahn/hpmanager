import { Character } from '../models/character'
import fs from 'fs';
import { join } from 'path';

const TEST_DIR: string = "/src/data/test/";
const DATA_DIR: string = "/src/data/";

/**
 * Interface for a character database connector. Abstracts all reading and writing from
 * consumers, so it can be switched out easily.
 */
export interface ICharacterDBConnector
{
    LoadCharacterFromDatabase(id: string): Character;
    SaveCharacterData(character: Character): void;
    ParseCharacterData(rawData: string): Character;
}

/**
 * Database connector that reads and writes to JSON files.
 */
export class JSONCharacterConnector implements ICharacterDBConnector
{
    /**
     * Will attempt to load the persistent data file for a character into a local Character object.
     * If the data file is not found, will attempt to load a character from the test data directory.
     * @param id The filename to load without any path or extension 
     */
    public LoadCharacterFromDatabase(id: string): Character
    {
        let path: string;
        let newfile: boolean = false;
        if (fs.existsSync(join(this.__getDataDir(), id + ".json")))
        {
            path = join(this.__getDataDir(), id + ".json");
        }
        else if (fs.existsSync(join(this.__getTestDir(), id + ".json")))
        {
            path = join(this.__getTestDir(), id + ".json");
            newfile = true;
        }
        if (!path) { return null; }

        const rawData: string = fs.readFileSync(path, "utf8");
        const myChar: Character = this.__JSONtoCharacter(rawData);

        return myChar;
    }

    /**
     * Saves a character into a JSON file in the main data directory, with any current data
     * @param character Character object
     */
    public SaveCharacterData(character: Character): void
    {
        fs.writeFileSync(this.__getCharacterFilename(character), JSON.stringify(character));
    }

    public ParseCharacterData(jsonStr: string): Character
    {
        return this.__JSONtoCharacter(jsonStr);
    }

    // ********************************
    //      Helper functions
    // *******************************
    /**
     * Parses a JSON string into a Character object
     * @param jsonStr Raw character data in a JSON string
     * @returns A Character object
     */
    private __JSONtoCharacter(jsonStr: string): Character
    {
        if (!jsonStr)
        {
            console.log("\nERROR: Cannot parse undefined or empty JSON string.");
            return;
        }

        let myChar: Character;
        try
        {
            myChar = JSON.parse(jsonStr, function (prop, value)
            {
                // Force property names to lowercase
                var lower = prop.toLowerCase();
                if (prop === lower) return value;
                else this[lower] = value;
            });
        } catch (e)
        {
            console.log("\nThere was an error when parsing the JSON");
            console.log(jsonStr);
        }
        return myChar;
    }

    /**
     * Returns the directory for persistent character data
     */
    private __getDataDir(): string
    {
        return join(process.cwd(), DATA_DIR);
    }

    /**
     * Returns the directory for test data
     */
    private __getTestDir(): string
    {
        return process.cwd() + TEST_DIR;
    }

    /**
     * Determines the filename for saving to persistent character data. Will try
     * to use the character's name
     * @param character Character object
     */
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