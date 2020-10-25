import { nextTick } from "process";
import { Character, Health, CharacterClass } from "../models/character";

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
            if (isPrimaryClass) { classLevel = classLevel - 1; }

            // Everything but first level adds the average hit die + con mod
            let classHealth: number = (HealthManager.__getAverageRoll(hitDie) + conMod) * classLevel;
            calculatedMaxHP = calculatedMaxHP + classHealth;
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
}