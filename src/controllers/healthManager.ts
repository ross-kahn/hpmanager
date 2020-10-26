import { Character, Health, EDamageType, Defense, EDefenseType, EAbilities, Item } from "../models/character";

/**
 * Provides helper functions to calculate and manipulate the Health object of a Character
 */
export class HealthManager
{
    /**
     * Will return the current Health object of a character. If the Health object doesn't
     * exist, it will create one by calculating the max HP of the character.
     * @param character Character object
     */
    public GetCharacterHealth(character: Character): Health
    {
        if (character?.health) { return character.health; }
        else
        {
            let maxHP: number = this.__calculateMaxHP(character);
            character.health = new Health(maxHP);
        }
    }

    /**
     * Manipulates the Health object of a character by lowering a character's hitpoints or
     * temporary hitpoints. The Health object of a character must exist already before calling
     * this function
     * @param character Character object
     * @param dmgType Type of damage, e.g. "slashing"
     * @param dmgAmnt Amount of damage to attempt on the character
     */
    public DamageCharacter(character: Character, dmgType: EDamageType, dmgAmnt: number): void
    {
        if (!character?.health || !character.defenses)
        {
            console.log("ERROR: Could not calculate damage due to incorrect character formatting.")
            return;
        }

        // In the future, this can easily be updated to also look for any 'defenses' attached to an item the character is holding
        // Can also be updated to consider "weaknesses" as well as defenses

        let immunities: Defense[] = character.defenses.filter(def => (def.type == dmgType) && (def.defense == EDefenseType.Immunity));
        if (immunities.length > 0)
        {
            // If the player has any immunities to this damage type, they take no damage. No need to change anything.
            this.__logDamage(character, dmgAmnt, dmgType, EDefenseType.Immunity)
            return;
        }

        let isResistant: boolean;
        let rawDmg: number = dmgAmnt;
        let resistances: Defense[] = character.defenses.filter(def => (def.type == dmgType) && (def.defense == EDefenseType.Resistance));
        if (resistances.length > 0)
        {
            dmgAmnt = Math.floor(dmgAmnt / 2);
            isResistant = true;
        }

        // Temp HP acts like a "shield" to damage. Reduce tempHP before normal HP
        if (!character.health.temphp) { character.health.temphp = 0; }

        let tempHP: number = character.health.temphp;
        let diff: number = Math.abs(tempHP - dmgAmnt);

        if (dmgAmnt >= tempHP)
        {
            // The amount of damage is greater than the number of temp hitpoints. Do damage and set tempHP to 0
            character.health.hitpoints -= diff;
            character.health.temphp = 0;
            this.__logDamage(character, rawDmg, dmgType, isResistant ? EDefenseType.Resistance : null)
            return;
        }
        else
        {
            // There are enough temp hitpoints to cover the damage. Reduce tempHP
            character.health.temphp -= dmgAmnt;
            this.__logDamage(character, rawDmg, dmgType, isResistant ? EDefenseType.Resistance : null)
            return;
        }

    }

    /**
     * Adds hitpoints to a character. Will not add hitpoints past the characters allowed maximum.
     * @param character Character object
     * @param healAmnt Amount of hitpoints to attempt to heal the character with
     */
    public HealCharacter(character: Character, healAmnt: number)
    {
        if (!character?.health) { return; }

        let curHP: number = character.health.hitpoints;
        let maxHP: number = character.health.maxhp;

        curHP += healAmnt;
        if (curHP > maxHP) { curHP = maxHP; }   // Don't add past maximum

        character.health.hitpoints = curHP;
        this.__logHealing(character, healAmnt);
    }

    /**
     * Gives a character temporary hitpoints, as long as the character's current
     * temporary hitpoints are lower than the new amount.
     * @param character Character object
     * @param tempHP Amount of temporary hitpoints to assign to the character
     */
    public GiveCharacterTempHP(character: Character, tempHP: number)
    {
        if (!character?.health) { return; }

        let curTempHP: number = character.health.temphp;
        let replaced: boolean = false;
        if (tempHP > curTempHP)
        {
            character.health.temphp = tempHP;
            replaced = true;
        }
        this.__logTempHP(character, tempHP, replaced);
    }


    /**
     * Returns the maximum hit points for a character based on their constitution modifier
     * and classes. HP for each class level is added together to get the maximum HP. The HP for
     * a class level is calculated by taking the average rounded-up roll for that class's hit die*,
     * then adding the character's consitution modifier.
     * 
     * For the first level of the first class, the HP uses the maximum value of the class's hit die,
     * instead of the average rounded-up roll.
     * @param character 
     */
    private __calculateMaxHP(character: Character)
    {
        if (!character?.classes) { return 1; }

        let calculatedMaxHP: number = 0;
        let conScore: number = this.__getAbilityScore(character, EAbilities.Constitution);
        let conMod: number = this.__getModifier(conScore);

        // Calculate the class health for each class the character has levels in
        for (let characterClass of character.classes)
        {
            let isPrimaryClass: boolean = false;
            let classLevel: number = characterClass.classlevel;
            let hitDie: number = characterClass.hitdicevalue;

            // If there's no class level or no hit die, they shouldn't get any health from this class
            if (!classLevel || !hitDie) { return; }

            // First level of first class gets maximum hit die + con mod
            if (calculatedMaxHP === 0)
            {
                isPrimaryClass = true;
                calculatedMaxHP = hitDie + conMod;
            }
            if (isPrimaryClass) { classLevel -= 1; }

            // Everything but first level adds the average hit die + con mod
            let classHealth: number = (this.__getAverageRoll(hitDie) + conMod) * classLevel;
            calculatedMaxHP += classHealth;
        };

        return calculatedMaxHP;
    }

    /**
     * Gets a character's ability score from the Stats object, taking into account any items
     * the character is holding which would boost an ability
     * @param character Character object
     * @param ability Ability score to get the value of
     */
    __getAbilityScore(character: Character, ability: EAbilities): number
    {
        if (!character?.stats || !(ability in character.stats))
        {
            return 0;   // You're gonna have a real bad ability score if the character isn't formatted correctly
        }

        let baseAbility: number = Number(character.stats[ability]); // e.g. Constitution score
        if (!character.items) { return baseAbility; }

        // Find any items that might boost the chosen ability, and add it to the base ability score
        let items: Item[] = character.items.filter(itm => (itm.modifier?.affectedobject &&
            itm.modifier.affectedvalue &&
            itm.modifier.affectedobject == "stats" &&
            itm.modifier.affectedvalue == ability));

        for (let item of items)
        {
            if (item.modifier.value)
            {
                baseAbility += Number(item.modifier.value);
            }
        }

        return baseAbility;
    }

    /**
     * Calculates the rounded up average value of a die type
     * @param hitDice A die type's highest value (e.g. 6 for a d6 ). Must be >= 2
     * @returns The rounded up average of a hit die type
     */
    private __getAverageRoll(hitDice: number): number
    {
        if (!hitDice || hitDice < 2) { return 1; }

        let average: number = Math.ceil(((1 + hitDice) / 2)); // (Minimum + maximum)  / 2 rounded up
        if (average < 1) { average = 1; }

        return average;
    }

    /**
     * Helper function to determine the modifier of a character's ability (in the Stats object)
     * @param abilityScore Raw ability score from the Stats object
     */
    private __getModifier(abilityScore: number = 0): number
    {
        return Math.floor((abilityScore - 10) / 2);
    }

    /**
     * Prints a fun message to the console when a character gets damaged
     * @param character 
     * @param amount 
     * @param dmgType 
     * @param defense 
     */
    private __logDamage(character: Character, amount: number, dmgType: EDamageType, defense?: EDefenseType)
    {
        let extra: string = ".";
        switch (defense)
        {
            case EDefenseType.Immunity:
                extra = ", but has immunity!";
                break;
            case EDefenseType.Resistance:
                extra = ", but is resistant!";
                break;
        }
        console.log("\n" + character.name + " took " + amount + " points of " + dmgType + " damage" + extra);
        console.log(character.name + " now has " + character.health.hitpoints + "/" + character.health.maxhp + " HP and " + character.health.temphp + " temporary HP.");
    }

    /**
     * Prints a fun message to the console when a character is healed
     * @param character 
     * @param amount 
     */
    private __logHealing(character: Character, amount: number)
    {
        console.log("\n" + character.name + " was healed by " + amount + " points!");
        console.log(character.name + " now has " + character.health.hitpoints + "/" + character.health.maxhp + " HP and " + character.health.temphp + " temporary HP.");
    }

    /**
     * Prints a fun message to the console when a character gets temporary hitpoints
     * @param character 
     * @param tempHP 
     * @param replaced 
     */
    private __logTempHP(character: Character, tempHP: number, replaced: boolean)
    {
        if (replaced)
        {
            console.log("\n" + character.name + " now has " + character.health.temphp + " temporary HP!");
        } else
        {
            console.log("\n" + character.name + " already has " + character.health.temphp + " temporary hitpoints, so getting " + tempHP + " temporary HP does nothing.");
        }
        console.log(character.name + " has " + character.health.hitpoints + "/" + character.health.maxhp + " HP and " + character.health.temphp + " temporary HP.");
    }
}