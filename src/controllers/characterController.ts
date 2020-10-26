import { Character, EDamageType, Health } from '../models/character'
import fs from 'fs';
import { join } from 'path';
import { HealthManager } from './healthManager';
import { json, raw } from 'body-parser';

const TEST_DIR: string = "/src/data/test/";
const DATA_DIR: string = "/src/data/";

/**
 * Implements the interface between the database, the router, and the health manager
 */
export interface ICharacterController
{
    LoadCharacterFromDatabase(id: string): Character;
    SaveCharacterData(character: Character): void;
    GetCharacterHealth(character: Character, saveToFile: boolean): Health;
    DamageCharacter(character: Character, dmgType: EDamageType, dmgAmount: number): void;
    HealCharacter(character: Character, healAmt: number): void;
    GiveTempHP(character: Character, tempHP: number): void;
    CreateNewCharacter(id: string, rawData: string): Character
}


/**
 * Interfaces with the database (in this case just local JSON files), the router, and the 
 * health manager. 
 */
export class JSONCharacterController implements ICharacterController
{

    // Provides helper functions to manipulate and use the Health properties on Character objects
    private __healthManager: HealthManager;

    constructor()
    {
        this.__healthManager = new HealthManager();
    }

    // ********************************
    //      Public functions
    // *******************************
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
        let myChar: Character = this.__JSONtoCharacter(rawData);
        if (myChar)
        {
            myChar.filename = id;
            this.GetCharacterHealth(myChar, false);  // This will initialize the character health and save it to the file
        }
        return myChar;
    }

    /**
     * Creates a new character and saves it to a JSON file
     * @param id Filename of the file to write
     * @param rawData JSON character string
     */
    public CreateNewCharacter(id: string, rawData: string): Character
    {
        let myChar: Character = this.__JSONtoCharacter(rawData);
        if (myChar)
        {
            myChar.filename = id;
            this.GetCharacterHealth(myChar, true);// Initialize health
            this.SaveCharacterData(myChar);
        }
        return myChar;
    }

    /**
     * Saves a character into a JSON file in the main data directory, with any current data
     * @param character Character object
     */
    public SaveCharacterData(character: Character): void
    {
        fs.writeFile(this.__getCharacterFilename(character), JSON.stringify(character), () => { });
    }

    /**
     * Retrieves character's health information if it exists, or calculates it based on character
     * information. Triggers a save to the database.
     * @param character Character object
     * @param saveToFile If true, this call will save to file. Pass false to skip that step.
     */
    public GetCharacterHealth(character: Character, saveToFile: boolean): Health
    {
        let charHealth: Health = this.__healthManager.GetCharacterHealth(character);
        return charHealth;
    }

    /**
     * Deal a particular kind of damage to a character. The character is then saved to the file.
     * @param character Character object
     * @param dmgType Type of damage. Character might have resistance or immunity.
     * @param dmgAmount Power of the damage. This may be reduced if character has resistance or immunity.
     */
    public DamageCharacter(character: Character, dmgType: EDamageType, dmgAmount: number): void
    {
        if (!character.health) { this.GetCharacterHealth(character, false); }
        this.__healthManager.DamageCharacter(character, dmgType, dmgAmount);
        this.SaveCharacterData(character);
    }

    /**
     * Heal the player's hitpoints, then save the character to the file.
     * @param character Character object
     * @param healAmt Number of hitpoints to heal
     */
    public HealCharacter(character: Character, healAmt: number): void
    {
        if (!character.health) { this.GetCharacterHealth(character, false); }
        this.__healthManager.HealCharacter(character, healAmt);
        this.SaveCharacterData(character);
    }

    /**
     * Gives the character temporary hitpoints, which "shields" the character from damage. If the
     * character already has temporary hitpoints, then the larger of the two values is used. TempHP is
     * not additive.
     * @param character Character object
     * @param tempHP Number of temporary hitpoints to assign to the character
     */
    public GiveTempHP(character: Character, tempHP: number)
    {
        if (!character.health) { this.GetCharacterHealth(character, false); }
        this.__healthManager.GiveCharacterTempHP(character, tempHP);
        this.SaveCharacterData(character);
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