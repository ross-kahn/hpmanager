import { ICharacterDBConnector } from 'db/connection';
import { Character, CharacterClass, EDamageType, Health } from '../models/character';
import { HealthManager } from './healthManager';

/**
 * Controller between the database, the character manipulation behavior APIs, and the router
 */
export class CharacterController
{

    // Provides helper functions to manipulate and use the Health properties on Character objects
    private __healthManager: HealthManager;
    private __dbConnection: ICharacterDBConnector;

    constructor(dbConnection: ICharacterDBConnector)
    {
        this.__healthManager = new HealthManager();
        this.__dbConnection = dbConnection;
    }

    // ********************************
    //      Public functions
    // *******************************
    public LoadCharacterFromDatabase(id: string): Character
    {
        let myChar: Character = this.__dbConnection.LoadCharacterFromDatabase(id);
        if (myChar)
        {
            myChar.filename = id;
            this.GetCharacterHealth(myChar);  // This will initialize the character health and save it to the file
        }
        return myChar;
    }

    /**
     * Creates a new character from JSON data and saves it using whatever DB connection
     * @param id Filename of the file to write
     * @param rawData Character data string
     */
    public CreateNewCharacter(id: string, rawData: string): Character
    {
        let myChar: Character = this.__dbConnection.ParseCharacterData(rawData);
        if (myChar)
        {
            myChar.filename = id;
            this.GetCharacterHealth(myChar);// Initialize health
            this.__dbConnection.SaveCharacterData(myChar);
        }
        return myChar;
    }

    /**
     * Retrieves character's health information if it exists, or calculates it based on character
     * information. Triggers a save to the database.
     * @param character Character object
     * @param saveToFile If true, this call will save to file. Pass false to skip that step.
     */
    public GetCharacterHealth(character: Character): Health
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
        if (!character.health) { this.GetCharacterHealth(character); }
        this.__healthManager.DamageCharacter(character, dmgType, dmgAmount);
        this.__dbConnection.SaveCharacterData(character);
    }

    /**
     * Heal the player's hitpoints, then save the character to the file.
     * @param character Character object
     * @param healAmt Number of hitpoints to heal
     */
    public HealCharacter(character: Character, healAmt: number): void
    {
        if (!character.health) { this.GetCharacterHealth(character); }
        this.__healthManager.HealCharacter(character, healAmt);
        this.__dbConnection.SaveCharacterData(character);
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
        if (!character.health) { this.GetCharacterHealth(character); }
        this.__healthManager.GiveCharacterTempHP(character, tempHP);
        this.__dbConnection.SaveCharacterData(character);
    }


    /**
     * Internal basic testing tool. In production we'd use a unit test suite
     * This will run Briv (actually, Briv's clone 'Testbriv') through a set of hard-coded tests
     */
    public TestCharacter(): boolean
    {
        console.log("\nStarting test suite...");
        let _briv: Character = this.LoadCharacterFromDatabase("briv");
        if (!_briv || !_briv.health) { return this.__testFailure(_briv, "(1) Test failed at load"); }

        this.CreateNewCharacter("testbriv", JSON.stringify(_briv));
        _briv = this.LoadCharacterFromDatabase("testbriv");
        if (!_briv || !_briv.health) { return this.__testFailure(_briv, "(2) Test failed at character creation / saving"); }

        _briv.name = "Testbriv";

        let health: Health = _briv.health;
        if (health.hitpoints != 45 || health.maxhp != 45 || health.temphp != 0)
        {
            return this.__testFailure(_briv, "(3) Test failed at HP calculation.");
        }

        this.GiveTempHP(_briv, 10);
        health = _briv.health;
        if (health.hitpoints != 45 || health.maxhp != 45 || health.temphp != 10)
        {
            return this.__testFailure(_briv, "(4) Test failed at gaining temp hitpoints");
        }

        this.GiveTempHP(_briv, 5);
        health = _briv.health;
        if (health.hitpoints != 45 || health.maxhp != 45 || health.temphp != 10)
        {
            return this.__testFailure(_briv, "(4a) Test failed at choosing higher temp HP value");
        }

        this.DamageCharacter(_briv, EDamageType.Acid, 5);
        health = _briv.health;
        if (health.hitpoints != 45 || health.maxhp != 45 || health.temphp != 5)
        {
            return this.__testFailure(_briv, "(5) Test failed at damaging temp HP");
        }

        this.DamageCharacter(_briv, EDamageType.Fire, 5);
        health = _briv.health;
        if (health.hitpoints != 45 || health.maxhp != 45 || health.temphp != 5)
        {
            return this.__testFailure(_briv, "(6) Test failed at damaging with immunity");
        }

        this.DamageCharacter(_briv, EDamageType.Slashing, 9);
        health = _briv.health;
        if (health.hitpoints != 45 || health.maxhp != 45 || health.temphp != 1)
        {
            return this.__testFailure(_briv, "(7) Test failed at damaging with resistance (rounding down)");
        }

        this.DamageCharacter(_briv, EDamageType.Bludgeoning, 11);
        health = _briv.health;
        if (health.hitpoints != 35 || health.maxhp != 45 || health.temphp != 0)
        {
            return this.__testFailure(_briv, "(8) Test failed at damaging both temp HP and normal HP");
        }

        this.HealCharacter(_briv, 5);
        health = _briv.health;
        if (health.hitpoints != 40 || health.maxhp != 45 || health.temphp != 0)
        {
            return this.__testFailure(_briv, "(9) Test failed at healing");
        }

        this.HealCharacter(_briv, 10);
        health = _briv.health;
        if (health.hitpoints != 45 || health.maxhp != 45 || health.temphp != 0)
        {
            return this.__testFailure(_briv, "(10) Test failed at healing above maximum");
        }

        this.DamageCharacter(_briv, EDamageType.Lightning, 55);
        health = _briv.health;
        if (health.hitpoints != -10 || health.maxhp != 45 || health.temphp != 0)
        {
            return this.__testFailure(_briv, "(11) Test failed at damaging below 0");
        }

        return this.__testSuccess("\nTestbriv is damaged but he passed the test! Huzzah!");
    }

    private __testFailure(testBriv: Character, message: string): boolean
    {
        console.log(message);
        console.log(testBriv);
        return false;
    }

    private __testSuccess(message: string): boolean
    {
        console.log(message);
        return true;
    }

}