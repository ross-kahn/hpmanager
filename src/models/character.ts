export type Character = {
    name: string;
    level: number;
    classes: CharacterClass[];
    stats: Abilities;
    items: Item[];
    health: Health;
    filename: string;
}

export type CharacterClass = {
    name: string;
    hitdicevalue: number;
    classlevel: number;
}

export type Abilities = {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
}

export type Item = {
    name: string;
    modifier: Modifier;
}

export type Modifier = {
    affectedobject: string; // e.g. "stats"
    affectedvalue: string;  // e.g. "constitution"
    value: number;
}

export type Defense = {
    type: EDamageType;   // e.g. "fire"
    defense: EDefenseType // e.g. "resistance"
}

export class Health
{
    constructor(maxHP: number)
    {
        this.temphp = 0;
        this.tempmaxhp = 0;
        this.maxhp = maxHP;
        this.hitpoints = maxHP;
    }
    hitpoints: number;
    maxhp: number;
    temphp: number;
    tempmaxhp: number;
}


export enum EDamageType
{
    Slashing = "slashing",
    Piercing = "piercing",
    Bludgeoning = "bludgeoning",
    Poison = "poison",
    Acid = "acid",
    Fire = "fire",
    Cold = "cold",
    Radiant = "radiant",
    Necrotic = "necrotic",
    Lightning = "lightning",
    Thunder = "thunder",
    Force = "force",
    Psychic = "psychic"
}

export enum EDefenseType
{
    Resistance = "resistance",
    Immunity = "immunity"
}

export enum EAbilities
{
    Strength = "strength",
    Dexterity = "dexterity",
    Constitution = "constitution",
    Intelligence = "intelligence",
    Wisdom = "wisdom",
    Charisma = "charisma",
}