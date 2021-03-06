<?php
    // globals.php
    // Just a file holding all the constant data structures and global variables for this game
    // for Settlers & Warlords

    $userid = 0;
    $accesscode = 0;
    $worldBiomes = ['grassland', 'forest', 'desert', 'swamp', 'water', 'jungle', 'lavascape', 'frozen waste'];
        // Note that some biomes are generated during civilization generation, instead of map generation
    $knownMapBiomes = ['exploring'];
        // knownMapBiomes are added onto the world biome types. They handle special-case situations such as exploring new lands
        // we don't have any other types yet... hopefully this won't be the last.

    $OreTypes = [
        'Coal', 'Banded Iron', 'Cassiterite', 'Chalcopyrite', 'Aluminum', 'Bauxite', 'Stibnite', 'Limonite', 'Magnetite',
        'Lignite', 'Tin', 'Copper', 'Silicon', 'Lithium', 'Gold', 'Silver', 'Uraninite', 'Cinnabar'
    ];
    // For now, any biome can contain any type of ore. But only that ore type will be in that map tile; players will need to venture
    // out to find additional types

    // Remember, each colonist consumes 1 food every 5 minutes, or 12 an hour

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
        ['id'=>31, 'name'=>'Swirl Altar',           'image'=>'', 'desc'=>'An altar making things around it twist and swirld. Is it safe to approach?'],
        ['id'=>32, 'name'=>'Dolphin Pod',           'image'=>'', 'desc'=>'Intelligent sea creatures, hunting in packs'],
        ['id'=>33, 'name'=>'Water Elemental',       'image'=>'', 'desc'=>'A creature made entirely of water, nothing seems to harm it'],
        ['id'=>34, 'name'=>'Crustacean Cluster',    'image'=>'civcrustacean.png', 'desc'=>'Armored sea creatures large and small, using sharp pincers to kill their prey'],
        ['id'=>35, 'name'=>'Angry Whale',           'image'=>'', 'desc'=>'A creature larger than the largest ships'],
        ['id'=>36, 'name'=>'Plant Elemental',       'image'=>'', 'desc'=>'An abomination made of plant matter, weapons have no effect on it'],
        ['id'=>37, 'name'=>'Gorrila Camp',          'image'=>'', 'desc'=>'A camp of humanoid jungle creatures, using their might to fend off enemies'],
        ['id'=>38, 'name'=>'Life Altar',            'image'=>'', 'desc'=>'An altar devoted to life forces. What can be learned here?'],
    ];

    // This holds specific tile information based on 
    $biomeData = [
        [
            'biome'=>'plains',
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
                ['name'=>'trees', 'amount'=>5],
                ['name'=>'water', 'amount'=>2],
                ['name'=>'rock', 'amount'=>2]
            ])
        ],[
            'biome'=>'forest',
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
                ['name'=>'ice horrors', 'amount'=>1],
                ['name'=>'ork tribe', 'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'trees', 'amount'=>25],
                ['name'=>'wheat', 'amount'=>1],
                ['name'=>'oat',   'amount'=>1],
                ['name'=>'rye',   'amount'=>1],
                ['name'=>'barley','amount'=>1],
                ['name'=>'millet','amount'=>1],
                ['name'=>'water', 'amount'=>5],
                ['name'=>'rock', 'amount'=>2]
            ])
        ],[
            'biome'=>'desert',
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
            'civs'=> new WeightedRandom([
                ['name'=>'dwarves', 'amount'=>3],
                ['name'=>'malicious vines', 'amount'=>3],
                ['name'=>'sludge elemental', 'amount'=>4],
                ['name'=>'necromancer', 'amount'=>4],
                ['name'=>'fairie camp', 'amount'=>4],
                ['name'=>'swamp horror', 'amount'=>5],
                ['name'=>'swirl altar', 'amount'=>2],
                ['name'=>'ice horrors', 'amount'=>1],
                ['name'=>'ork tribe', 'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'water', 'amount'=>100],
                ['name'=>'wheat', 'amount'=>12],
                ['name'=>'oat',   'amount'=>12],
                ['name'=>'rye',   'amount'=>12],
                ['name'=>'barley','amount'=>12],
                ['name'=>'millet','amount'=>12],
                ['name'=>'trees', 'amount'=>40],
                ['name'=>'rock', 'amount'=>15]
            ])
        ],[
            'biome'=>'water',
            'civs'=> new WeightedRandom([
                ['name'=>'dolphin pod', 'amount'=>4],
                ['name'=>'water elemental', 'amount'=>3],
                ['name'=>'crustacean cluster', 'amount'=>2],
                ['name'=>'angry whale', 'amount'=>3]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'water', 'amount'=>23],
                ['name'=>'rock', 'amount'=>2]
            ])
        ],[
            'biome'=>'jungle',
            'civs'=> new WeightedRandom([
                ['name'=>'dwarves', 'amount'=>3],
                ['name'=>'plant elemental', 'amount'=>4],
                ['name'=>'gorrila camp', 'amount'=>6],
                ['name'=>'life altar', 'amount'=>2],
                ['name'=>'ice horrors', 'amount'=>1],
                ['name'=>'ork tribe', 'amount'=>1]
            ]),
            'localTiles'=> new WeightedRandom([
                ['name'=>'water', 'amount'=>50],
                ['name'=>'trees', 'amount'=>80],
                ['name'=>'wheat', 'amount'=>4],
                ['name'=>'oat',   'amount'=>4],
                ['name'=>'rye',   'amount'=>4],
                ['name'=>'barley','amount'=>4],
                ['name'=>'millet','amount'=>4],
                ['name'=>'rock', 'amount'=>5]
            ])
        ]
    ];

    //                  0         1      2       3          4        5       6       7        8        9      10      11
    $localTileNames = ['wheat', 'oat', 'rye', 'barley', 'millet', 'trees', 'rock', 'sands', 'water', 'lava', 'ice', 'snow'];
    // Are we just going to stick with one type of tree land? No way! But we're just not 'there' yet. Gotta keep at it!

    define('x', 'x');
    define('y', 'y');
    $directionMap = [
        [[x=> 0, y=>-1], [x=> 1, y=> 0], [x=> 0, y=> 1], [x=>-1, y=> 0]],
        [[x=> 0, y=>-1], [x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=> 1]],
        [[x=> 0, y=>-1], [x=> 0, y=> 1], [x=> 1, y=> 0], [x=>-1, y=> 0]],
        [[x=> 0, y=>-1], [x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 1, y=> 0]],
        [[x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=> 1]],
        [[x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 1, y=> 0]],
        [[x=> 1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1], [x=>-1, y=> 0]],
        [[x=> 1, y=> 0], [x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 0, y=> 1]],
        [[x=> 1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=>-1], [x=>-1, y=> 0]],
        [[x=> 1, y=> 0], [x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 0, y=>-1]],
        [[x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1]],
        [[x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=>-1]],
        [[x=> 0, y=> 1], [x=> 0, y=>-1], [x=> 1, y=> 0], [x=>-1, y=> 0]],
        [[x=> 0, y=> 1], [x=> 0, y=>-1], [x=>-1, y=> 0], [x=> 1, y=> 0]],
        [[x=> 0, y=> 1], [x=> 1, y=> 0], [x=> 0, y=>-1], [x=>-1, y=> 0]],
        [[x=> 0, y=> 1], [x=> 1, y=> 0], [x=>-1, y=> 0], [x=> 0, y=>-1]],
        [[x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 1, y=> 0]],
        [[x=> 0, y=> 1], [x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=>-1]],
        [[x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 1, y=> 0], [x=> 0, y=> 1]],
        [[x=>-1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1], [x=> 1, y=> 0]],
        [[x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=>-1], [x=> 0, y=> 1]],
        [[x=>-1, y=> 0], [x=> 1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=>-1]],
        [[x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 1, y=> 0], [x=> 0, y=> 1]],
        [[x=>-1, y=> 0], [x=> 0, y=> 1], [x=> 0, y=> 1], [x=> 1, y=> 0]]
    ];
    // This directionmap looks complicated, but once you know how to use it, it'll make lots of sense. The objective here is to
    // pick a random direction, but if that doesn't work, pick another one. Picking one, and trying to prevent re-using the same
    // one for another pass, results in code that is much more complicated than desired. Here, you select a top-level array
    // entry at random. You then use the first 'set' of that as your random direction. If that doesn't work, try the next set.
    // If you go through all four sets, there are no other possible directions to go; options are exhausted, you're finished
    // checking.
?>