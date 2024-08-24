<?php
    /*  globals.php
        Holds global constants for the game, mostly as data structures
        For the game Settlers & Warlords
    */

    require_once("libs/weightedRandom.php");

    $chunkWidth = 8;
    $biomeTileSize = 8;

    
    $oreTypes = [
        'Coal', 'Banded Iron', 'Cassiterite', 'Chalcopyrite', 'Aluminum', 'Bauxite', 'Stibnite', 'Limonite', 'Magnetite',
        'Lignite', 'Tin', 'Copper', 'Silicon', 'Lithium', 'Gold', 'Silver', 'Uraninite', 'Cinnabar'
    ];
    
    $oreTypes2 = [  // ... we're not really ready to try & use this list yet. We still need to work on it, though
        ['name'=>'Coal',        'minDepth'=>8, 'maxDepth'=>25, 'height'=>6, 'heightVariance'=>6, 'minDensity'=>100, 'maxDensity'=>600, 'invFrequency'=>20],
        ['name'=>'Banded Iron', 'minDepth'=>10, 'maxDepth'=>30, 'height'=>8, 'heightVariance'=>6, 'minDensity'=>80, 'maxDensity'=>800, 'invFrequency'=>16],
        // Banded iron comes from prehistoric microbes; they filtered out iron from the oceans, depositing it there. Earth forces moved it around
        ['name'=>'Cassiterite',  'minDepth'=>15, 'maxDepth'=>60, 'height'=>10, 'heightVariance'=>10, 'minDensity'=>120, 'maxDensity'=>500, 'invFrequency'=>30, 'formation'=>'veins'],
        // Cassiterite is an ore of tin https://www.mindat.org/min-917.html
        ['name'=>'Chalcopyrite', 'minDepth'=>10, 'maxDepth'=>25, 'height'=>5, 'heightVariance'=>8, 'minDensity'=>100, 'maxDensity'=>400, 'invFrequency'=>12],
        ['name'=>'Chalcocite',   'minDepth'=>8, 'maxDepth'=>30, 'height'=>6, 'heightVariance'=>7, 'minDensity'=>130, 'maxDensity'=>600, 'invFrequency'=>8]

    ];
    // invFrequency aka invert frequency is the number of tiles between when we'll see this ore. A high number will be seen less common than a low one
    // density describes how many ore blocks can be found in a given cluster
    // height & density variables probably won't be determined until a given map is loaded


    // This holds specific tile information based on the biome selected
    $biomeData = [
        [
            'biome'=>'grassland',
            'frequency'=>10,
            'supportsNewPlayers'=>true,
            'civs'=> new weightedRandom([
                ['name'=>'horse-mounted raiders', 'amount'=>10],
                ['name'=>'centaur tribe', 'amount'=>4],
                ['name'=>'farmers camp', 'amount'=>8],
                ['name'=>'herders camp', 'amount'=>5],
                ['name'=>'castle', 'amount'=>5],
                ['name'=>'dwarves', 'amount'=>3],
                ['name'=>'grass elemental', 'amount'=>4],
                ['name'=>'roah pack', 'amount'=>7],
                ['name'=>'zenith altar', 'amount'=>2],
                ['name'=>'ice horrors', 'amount'=>1],
                ['name'=>'ork tribe', 'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'wheat', 'amount'=>5],  // golden, especially when ripe
                ['name'=>'oat',   'amount'=>5],  // whiter color, more pale
                ['name'=>'rye',   'amount'=>5],  // leans more orange than golden
                ['name'=>'barley','amount'=>5],  // a greenish yellow
                ['name'=>'millet','amount'=>5],  // two-tone pale white & green
                ['name'=>'maple', 'amount'=>3],
                ['name'=>'locust','amount'=>1],
                ['name'=>'apple', 'amount'=>1],
                ['name'=>'water', 'amount'=>2],
                ['name'=>'rock',  'amount'=>2]
            ]),
            'rarePlants'=> new WeightedRandom([
                ['name'=>'carrots', 'amount'=>10],
                ['name'=>'potatoes', 'amount'=>10],
                ['name'=>'tomatoes', 'amount'=>7],
                ['name'=>'turnip', 'amount'=>4],
                ['name'=>'peanut', 'amount'=>7],
                ['name'=>'maize', 'amount'=>12],
                ['name'=>'beans', 'amount'=>10],
                ['name'=>'onion', 'amount'=>10],
            ])
        ],[
            'biome'=>'forest',
            'frequency'=>10,
            'supportsNewPlayers'=>true,
            'civs'=> new WeightedRandom([
                ['name'=>'elves', 'amount'=>5],
                ['name'=>'enchanted grove', 'amount'=>4],
                ['name'=>'lumberjack grove', 'amount'=>6],
                ['name'=>'malicious vines', 'amount'=>2],
                ['name'=>'ent clan', 'amount'=>6],
                ['name'=>'magicians', 'amount'=>4],
                ['name'=>'werewolf pack', 'amount'=>6],
                ['name'=>'dwarves', 'amount'=>3],
                ['name'=>'wood elemental', 'amount'=>4],
                ['name'=>'fairie camp', 'amount'=>4],
                ['name'=>'wisp altar', 'amount'=>2],
                ['name'=>'ice horrors',      'amount'=>1],
                ['name'=>'ork tribe',        'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'oak',   'amount'=>5],
                ['name'=>'birch', 'amount'=>3],
                ['name'=>'maple',   'amount'=>2],
                ['name'=>'pine',    'amount'=>4],
                ['name'=>'cedar',   'amount'=>4],
                ['name'=>'hemlock', 'amount'=>1],
                ['name'=>'apple',   'amount'=>1],
                ['name'=>'juniper',  'amount'=>1],
                ['name'=>'mahogany', 'amount'=>1],
                ['name'=>'dogwood',  'amount'=>1],
                ['name'=>'wheat',    'amount'=>1],
                ['name'=>'oat',   'amount'=>1],
                ['name'=>'rye',   'amount'=>1],
                ['name'=>'barley','amount'=>1],
                ['name'=>'millet','amount'=>1],
                ['name'=>'water', 'amount'=>5],
                ['name'=>'rock', 'amount'=>2]
            ]),
            'rarePlants'=> new WeightedRandom([
                ['name'=>'carrots', 'amount'=>10],
                ['name'=>'potatoes', 'amount'=>10],
                ['name'=>'turnip', 'amount'=>8],
                ['name'=>'beans', 'amount'=>10],
                ['name'=>'onion', 'amount'=>8],
                ['name'=>'broccoli', 'amount'=>4],
                ['name'=>'pumpkin', 'amount'=>5],
                ['name'=>'mushroom', 'amount'=>12]
            ])
        ],[
            'biome'=>'desert',
            'frequency'=>7,
            'supportsNewPlayers'=>false,
            'civs'=> new WeightedRandom([
                ['name'=>'oasis camp', 'amount'=>5],
                ['name'=>'scorpion den', 'amount'=>4],
                ['name'=>'dwarves', 'amount'=>3],
                ['name'=>'sand elemental', 'amount'=>3],
                ['name'=>'sun altar', 'amount'=>2],
                ['name'=>'moon altar', 'amount'=>2],
                ['name'=>'wind altar', 'amount'=>2],
                ['name'=>'earth altar', 'amount'=>2],
                ['name'=>'ice horrors', 'amount'=>1],
                ['name'=>'ork tribe', 'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'sands', 'amount'=>125],
                ['name'=>'rock', 'amount'=>25],
                ['name'=>'wheat', 'amount'=>3],
                ['name'=>'oat',   'amount'=>3],
                ['name'=>'rye',   'amount'=>3],
                ['name'=>'barley','amount'=>3],
                ['name'=>'millet','amount'=>3],
                ['name'=>'water', 'amount'=>5]
            ])
        ],[
            'biome'=>'swamp',
            'frequency'=>6,
            'supportsNewPlayers'=>false,
            'civs'=> new WeightedRandom([
                ['name'=>'dwarves', 'amount'=>3],
                ['name'=>'malicious vines', 'amount'=>3],
                ['name'=>'sludge elemental', 'amount'=>4],
                ['name'=>'necromancer', 'amount'=>4],
                ['name'=>'fairie camp', 'amount'=>4],
                ['name'=>'swamp horror', 'amount'=>5],
                ['name'=>'swirl altar', 'amount'=>2],
                ['name'=>'ice horrors',      'amount'=>1],
                ['name'=>'ork tribe',        'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'water', 'amount'=>100],
                ['name'=>'wheat', 'amount'=>12],
                ['name'=>'oat',   'amount'=>12],
                ['name'=>'rye',   'amount'=>12],
                ['name'=>'barley','amount'=>12],
                ['name'=>'millet','amount'=>12],
                ['name'=>'maple',    'amount'=>12],
                ['name'=>'birch',    'amount'=>8],
                ['name'=>'oak',      'amount'=>5],
                ['name'=>'mahogany', 'amount'=>5],
                ['name'=>'cherry',   'amount'=>2],
                ['name'=>'apple',    'amount'=>2],
                ['name'=>'orange',   'amount'=>2],
                ['name'=>'hawthorne', 'amount'=>2],
                ['name'=>'rock',      'amount'=>15]
            ])
        ],[
            'biome'=>'water',
            'frequency'=>12,
            'supportsNewPlayers'=>false,
            'civs'=> new WeightedRandom([
                ['name'=>'dolphin pod', 'amount'=>4],
                ['name'=>'water elemental', 'amount'=>3],
                ['name'=>'crustacean cluster', 'amount'=>2],
                ['name'=>'angry whale',        'amount'=>3]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'water', 'amount'=>23],
                ['name'=>'rock', 'amount'=>2]
            ])
        ],[
            'biome'=>'jungle',
            'frequency'=>9,
            'supportsNewPlayers'=>false,
            'civs'=> new WeightedRandom([
                ['name'=>'dwarves',         'amount'=>3],
                ['name'=>'plant elemental', 'amount'=>4],
                ['name'=>'gorrila camp',    'amount'=>6],
                ['name'=>'life altar',      'amount'=>2],
                ['name'=>'ice horrors',     'amount'=>1],
                ['name'=>'ork tribe',       'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'water',    'amount'=>30],
                ['name'=>'maple',    'amount'=>5],
                ['name'=>'oak',      'amount'=>10],
                ['name'=>'birch',    'amount'=>20],
                ['name'=>'mahogany', 'amount'=>5],
                ['name'=>'pine',     'amount'=>5],
                ['name'=>'fir',      'amount'=>5],
                ['name'=>'cherry',   'amount'=>5],
                ['name'=>'apple',     'amount'=>5],
                ['name'=>'orange',    'amount'=>10],
                ['name'=>'dogwood',   'amount'=>5],
                ['name'=>'hawthorne', 'amount'=>3],
                ['name'=>'juniper',   'amount'=>2],
                ['name'=>'wheat',     'amount'=>4],
                ['name'=>'oat',   'amount'=>4],
                ['name'=>'rye',   'amount'=>4],
                ['name'=>'barley','amount'=>4],
                ['name'=>'millet','amount'=>4],
                ['name'=>'rock', 'amount'=>5]
            ])
        ],[
            'biome'=>'frozen wasteland',
            'frequency'=>0,
            'supportsNewPlayers'=>false
        ],[
            'biome'=>'lavascape',
            'frequency'=>0,
            'supportsNewPlayers'=>false
        ]
    ];

    $localTileNames = [
        //     0       1         2      3
            'air',   'dirt',  'rock', 'treebranches',
        //     4       5      6       7          8
            'wheat', 'oat', 'rye', 'barley', 'millet',
        //     9        10       11       12        13      14      15      16         17       18       19       20         21         22         23         24
            'maple', 'birch', 'oak', 'mahogany', 'pine', 'cedar', 'fir', 'hemlock', 'cherry', 'apple', 'pear', 'orange', 'hawthorn', 'dogwood', 'locust', 'juniper',
        //    25         26       27      28      29     30       31        32         33        34            35
            'gravel', 'sands', 'water', 'lava', 'ice', 'snow', 'stream', 'wetland', 'cliff', 'creekwash', 'creekbank',
        //     36          37          38         39        40        41       42      43        44           45         46
            'carrots', 'potatoes', 'tomatoes', 'turnip', 'peanut', 'maize', 'beans', 'onion', 'broccoli', 'pumpkin', 'mushroom'
    ];

    $civData = [
        ['id'=>0,  'name'=>'Horse-mounted Raiders', 'image'=>'', 'desc'=>'Human bandits with horses, known for attacking nearby lands, causing havoc.'],
        ['id'=>1,  'name'=>'Centaur Tribe',         'image'=>'', 'desc'=>'Half human, half horse, majestic and wise creatures'],
        ['id'=>2,  'name'=>'Farmers Camp',          'image'=>'', 'desc'=>'Simple humans who want nothing but to protect their lands and feed their families'],
        ['id'=>3,  'name'=>'Herders Camp',          'image'=>'', 'desc'=>'Simple humans who only want to protect their heards and families'],
        ['id'=>4,  'name'=>'Castle',                'image'=>'', 'desc'=>'A well-fortified structure of stone, built to withstand massive attacks'],
        ['id'=>5,  'name'=>'Dwarves',               'image'=>'', 'desc'=>'Stout humanoids who live mostly underground'],
        ['id'=>6,  'name'=>'Grass Elemental',       'image'=>'', 'desc'=>'A creature made of only grass, normal weapons do no harm to it'],
        ['id'=>7,  'name'=>'Roah Pack',             'image'=>'', 'desc'=>'Dinosaur creatures, these are fast runners, using it to ambush prey'],
        ['id'=>8,  'name'=>'Zenith Altar',          'image'=>'', 'desc'=>'An altar devoted to time & space. What happens to those who approach it?'],
        ['id'=>9,  'name'=>'Ice Horrors',           'image'=>'', 'desc'=>'Giant monsters who freeze the lands surrounding them. Can anything survive the cold?'],
        ['id'=>10, 'name'=>'Ork Tribe',             'image'=>'', 'desc'=>'Little humanoids who love fire and chaos, living only in lava pits'],
        ['id'=>11, 'name'=>'Elves',                 'image'=>'civelves.png', 'desc'=>'Humanoids with pointed ears, in tune with nature, using their excellent sight to hunt using bows'],
        ['id'=>12, 'name'=>'Enchanted Grove',       'image'=>'', 'desc'=>'There\'s something magical about these forests'],
        ['id'=>13, 'name'=>'Lumberjack Grove',      'image'=>'', 'desc'=>'A camp of humans who love nothing more than felling trees and caring for their families'],
        ['id'=>14, 'name'=>'Malicious Vines',       'image'=>'', 'desc'=>'Vines dominate this area, seeming to move visibly. Are they aware of us?'],
        ['id'=>15, 'name'=>'Ent Clan',              'image'=>'', 'desc'=>'Trees capable of walking, they prefer a slow, calm life, caring for the trees around them'],
        ['id'=>16, 'name'=>'Magicians',             'image'=>'', 'desc'=>'Humans devoting their life to studying magic, nobody knows the extent of their powers'],
        ['id'=>17, 'name'=>'Werewolf Pack',         'image'=>'civwerewolf.png', 'desc'=>'Appearing human, they become ferocious beasts in a fight. Identifiable only by their grizly appearance and unconcern of the elements'],
        ['id'=>18, 'name'=>'Wood Elemental',        'image'=>'', 'desc'=>'A creature made of only wood, normal weapons do little to slow it down'],
        ['id'=>19, 'name'=>'Fairie Camp',           'image'=>'', 'desc'=>'Tiny flying creatures, able to enchant things at will. Can they be trusted?'],
        ['id'=>20, 'name'=>'Wisp Altar',            'image'=>'', 'desc'=>'An altar holding glowing orbs and illuminated air'],
        ['id'=>21, 'name'=>'Oasis Camp',            'image'=>'', 'desc'=>'A city, sprouting around accessible water. Their only concern is to survive the heat'],
        ['id'=>22, 'name'=>'Scorpion Den',          'image'=>'', 'desc'=>'A camp of insects large and small, with quick poisonous tails used to kill their prey'],
        ['id'=>23, 'name'=>'Sand Elemental',        'image'=>'', 'desc'=>'An abomination made entirely of sand, weapons have no effect on it'],
        ['id'=>24, 'name'=>'Sun Altar',             'image'=>'', 'desc'=>'An altar devoted to the sun, but otherwise deserted. What can be learned here?'],
        ['id'=>25, 'name'=>'Moon Altar',            'image'=>'', 'desc'=>'An altar devoted to the moon, but otherwise deserted. What secrets does it hold?'],
        ['id'=>26, 'name'=>'Wind Altar',            'image'=>'', 'desc'=>'An altar devoted to the winds. Can it be used for anything?'],
        ['id'=>27, 'name'=>'Earth Altar',           'image'=>'', 'desc'=>'An altar devoted to the earth, but otherwise deserted. Does it hold any secrets?'],
        ['id'=>28, 'name'=>'Sludge Elemental',      'image'=>'', 'desc'=>'An abomination made of only water and sludge. Weapons do nothing to harm it'],
        ['id'=>29, 'name'=>'Necromancer',           'image'=>'', 'desc'=>'A magician, surrounding itself with undead, using its minions to do its bidding'],
        ['id'=>30, 'name'=>'Swamp Horror',          'image'=>'', 'desc'=>'A giant monster borne of the swamps, nothing seems to slow it down'],
        ['id'=>31, 'name'=>'Swirl Altar',           'image'=>'', 'desc'=>'An altar making things around it twist and swirl. Is it safe to approach?'],
        ['id'=>32, 'name'=>'Dolphin Pod',           'image'=>'', 'desc'=>'Intelligent sea creatures, hunting in packs'],
        ['id'=>33, 'name'=>'Water Elemental',       'image'=>'', 'desc'=>'A creature made entirely of water, nothing seems to harm it'],
        ['id'=>34, 'name'=>'Crustacean Cluster',    'image'=>'civcrustacean.png', 'desc'=>'Armored sea creatures large and small, using sharp pincers to kill their prey'],
        ['id'=>35, 'name'=>'Angry Whale',           'image'=>'', 'desc'=>'A creature larger than the largest ships'],
        ['id'=>36, 'name'=>'Plant Elemental',       'image'=>'', 'desc'=>'An abomination made of plant matter, weapons have no effect on it'],
        ['id'=>37, 'name'=>'Gorrila Camp',          'image'=>'', 'desc'=>'A camp of humanoid jungle creatures, using their might to fend off enemies'],
        ['id'=>38, 'name'=>'Life Altar',            'image'=>'', 'desc'=>'An altar devoted to life forces. What can be learned here?'],
    ];

    // We very much need names for all the workers that the player has, in order for players to keep them organized (on some level)
    // I pulled these from https://www.imagineforest.com/blog/fantasy-character-names/ from human names only (male & female)
    $workerNames = ['Akibrus', 'Aleera',    'Alva',      'Amara',   'Angun',   'Anya',   'Asralyn', 'Azura',    'Balrus',   'Breya',    'Brina',     'Bulruk',
                    'Caelia',  'Caldor',    'Ciscra',    'Dagen',   'Darvyn',  'Delvin', 'Dezaral', 'Dorath',   'Dracyian', 'Dray',     'Drusila',   'Elda', 
                    'Eldar',   'Engar',     'Esmeralla', 'Fabien',  'Farkas',  'Freya',  'Galdor',  'Gelda',    'Hadena',   'Igor',     'Jai-Blynn', 'Klayden',
                    'Kyla',    'Kyra',      'Laimus',    'Lavinia', 'Lunarex', 'Lyra',   'Malfas',  'Mireille', 'Norok',    'Nyssa',    'Olwyn',     'Orion',
                    'Ophelia', 'Peregrine', 'Pindious',  'Quintus', 'Rammir',  'Remus',  'Reyda',   'Rorik',    'Sabir ',   'Sarielle', 'Severin',   'Shikta',
                    'Sirius',  'Soril',     'Sulfu',     'Sybella', 'Syfas',   'Syfyn',  'Thalia',  'Turilla',  'Vasha',    'Viktas',   'Vixen',     'Vyn',
                    'Wilkass', 'Yagul',     'Yvanna',    'Zakkas',  'Zarek',   'Zaria',  'Zeniya',  'Zorion'];
    // male suffixes: ar, or, io, on, mus, mir, as, ik
    // female suffixes: ella, ina, sha, ia, illa, ica, ika, en, lia
?>


