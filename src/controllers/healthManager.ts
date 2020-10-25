import { nextTick } from "process";
import { Character, Health, EDamageType, Defense, EDefenseType } from "../models/character";

export class HealthManager
{
    public static GetCharacterHealth(character: Character): Health
    {
        if (character?.health) { return character.health; }
        else
        {
            let maxHP: number = HealthManager.__calculateMaxHP(character);
            character.health = new Health(maxHP);
        }
    }

    public static DamageCharacter(character: Character, dmgType: EDamageType, dmgAmnt: number): void
    {
        if (!character?.health || !character.defenses) { return; }

        // In the future, this can easily be updated to also look for any 'defenses' attached to an item the character is holding

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

    public static HealCharacter(character: Character, healAmnt: number)
    {
        if (!character?.health) { return; }

        let curHP: number = character.health.hitpoints;
        let maxHP: number = character.health.maxhp;

        curHP += healAmnt;
        if (curHP > maxHP) { curHP = maxHP; }

        character.health.hitpoints = curHP;
        this.__logHealing(character, healAmnt);
    }


    public static GiveCharacterTempHP(character: Character, tempHP: number)
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
    private static __calculateMaxHP(character: Character)
    {
        if (!character?.classes) { return 1; }

        let calculatedMaxHP: number = 0;
        let conMod: number = HealthManager.__getModifier(character.stats?.constitution);

        // Calculate the class health for each class the character has levels in
        character.classes.forEach(function (characterClass)
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
            let classHealth: number = (HealthManager.__getAverageRoll(hitDie) + conMod) * classLevel;
            calculatedMaxHP += classHealth;
        });

        return calculatedMaxHP;

    }

    /**
     * Calculates the rounded up average value of a die type
     * @param hitDice A die type's highest value (e.g. 6 for a d6 ). Must be >= 2
     * @returns The rounded up average of a hit die type
     */
    private static __getAverageRoll(hitDice: number): number
    {
        if (!hitDice || hitDice < 2) { return 1; }

        let average: number = Math.ceil(((1 + hitDice) / 2)); // (Minimum + maximum)  / 2 rounded up
        if (average < 1) { average = 1; }

        return average;
    }

    private static __getModifier(abilityScore: number = 0): number
    {
        return Math.floor((abilityScore - 10) / 2);
    }

    private static __logDamage(character: Character, amount: number, dmgType: EDamageType, defense?: EDefenseType)
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

    private static __logHealing(character: Character, amount: number)
    {
        console.log("\n" + character.name + " was healed by " + amount + " points!");
        console.log(character.name + " now has " + character.health.hitpoints + "/" + character.health.maxhp + " HP and " + character.health.temphp + " temporary HP.");
    }

    private static __logTempHP(character: Character, tempHP: number, replaced: boolean)
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