# Settlers & Warlords - Map Generation

Game maps will be gid based and ever-expanding, in the same way that Minecraft works. It will be divided into chunks, of approximately 16x16x16 blocks each. Each set of chunks sharing a Y (vertical) axis will have the same biome set to it. There will be many different biomes that can be generated.

Players will view the world from a first-person perspective. They will be 2 meters tall (equivalent to 2 blocks in height), and about 1 meter wide. Players will be able to jump up about a block in height, and jump down about 4 blocks in height without getting hurt.

Players will only be able to see the general area they are currently in. Areas outside of the player's view will continue to function. Players will have many ways to glean what is going on in remote places, depending on what tech tools they have available.

Players will not place items directly. Instead, they will order buildings and the like to be placed down, where they specify. The workers, or other automated machinery, will be employed to place the correct items where specified.

### Player view

The player will view the world from a first person perspective, most of the time. Players will be able to interact with nearby workers, declare buildings to be constructed, and even do some of the work themselves.

Player inventory will be severely limited, compared to other games; the most they will be able to carry is 3 tools, that they can swap between. Materials like dirt and stone will need to be hauled using a wheelbarrel or better. Smaller items or clothing (such as winter coats, fireproof gear or armor) can be equipped in various ways, and not affect this limitation. Players may equip themselves with backpacks as well, to increase their ability to carry small items. Food and water containers will fall into this category.

Beginner buildings will be merely places to conduct certain tasks. All later buildings will have to be constructed. These can be constructed by the player, if all the resources are at the building's site, and the player spends the time to complete them. Building construction will normally be handled by the player's workers, instead of directly by the player.

### Expeditions

Players can set up a Travel Depot. This structure is in charge of managing expeditions, where the player can assign workers to travel to nearby chunks to investigate what is there. This building will provide a world map that shows the information gleaned from these expeditions. It will start showing only the map chunk that the player is at, but can be expanded

### Remote editing

Players will be able to edit their territory using workers located in remote areas. A planning table will allow the player to see an overhead view of the world that they can control, which will include controls to zoom in & out, and shift layer views up and down. Players can order new equipment to be placed, or existing ones to be modified or removed. Blueprints can be generated from existing sections of your areas, and pasted to other areas you control, applying large changes to a player's areas.

Before players can begin editing a remote area, players will need to have the area surveyed. Most workers will be able to perform this task. Survey data will be set to a specific time point, and will have to be transported to the player before it is available. Changes will also take time for workers to travel to the area, see that the work is done, and return to report its completion. External events(such as raids or destructive attacks) can slow, alter or stop completion of such tasks.

### Old Debates

1.  Diplay game in FPS view or top-down view?
    -   FPS view will give a better perspective of the world, especially with the many layers that players should eventually be able to create
    *   FPS view will make it very hard to edit the map in remote places
    -   Top-down view will make it hard to view the world in a meaningful way. Layers will help, but if layers are really 3 blocks deep, how will slight shifts be properly displayed? Dwarf Fortress fixed this by having Dwarves smaller than a block, and changing layers went a whole floor at a time, because they were only one block in height. I'll be unable to do that here

## Old notes

With this game going 3D, the whole map system has changed. These are my old notes, for when the game was 2D

World map generation works based on the extent of my programming ability. Ideally, we would have a world generated that is similar to both Minecraft and Dwarf Fortress; a 3D world where players can view layers of the map, including very deep areas. The map will also divide into biomes, each with very diverse plant & animal life. Unfortunately, my skills aren't quite able to achieve that.

The player's view of the world is divided into 3 parts: a world map, a local land map, and an underground map. These are all (currently) 2D maps made of grid tiles.

## Local Map

Players can view all of the local land map that they reside in. This is the game view that they start in. Players can switch between viewing the local land map and world map at any time. Players will not be able to view the underground map until they begin mining (and have the appropirate equipment to do so).

Players can only view the local land map of the tile which they reside in. Players will have a 'King' unit, that represents their location. Players may chose to move this King unit to any other tile (assuming it is safe for that player to go there). Players can interact with any other tile by way of messengers and worker / army units.

## World Map

The view of the world map will be limited to what the player knows. When a player begins, they will only see the tile they reside in. Players will need to send exploratory expeditions to other tiles to learn more about them. Knowledge of any world tile will be based on the last time the player has received information from it; players will need to continue sending workers into / through tiles to maintain active details of that tile.

Expeditions to other world tiles can provide a player with basic information, such as biome and any active civilizations residing there. Expeditions will require players to use a minimum of one worker, and they must be provided with food for the journey. If a hostile civilization exists in the tile they visit (or travel through), expedition teams may be killed, giving no specific word on the tile - only that the expedition failed. Players may be able to see tile information by sending enough army units to overpower the hostile civilization.

Players may take over other world map tiles. If a tile is not occupied by another civilization or player, the player can send a minimum of 4 workers (with food for travel) to gain ownership of the tile. On send, players may chose a set of buildings to be built initially (including a Forage Post to collect food for these settlers). Players will then interact with these remote tiles by way of messengers. When paper and cartographers become available, players can have maps to be generated, allowing them a view of that tile when not at the location.

## Underground Map

Players will not be able to view underground maps until they are able to begin mining. The underground map will start at surface level and run indefinitely deep; players will be unable to view beyond the deepest & widest part of their mine.

Only one ore type (or group) will exist in any world map tile. Players will often start on world map tiles with ores that (being a new player) they cannot use. They will need to acquire additional tiles and try mining there. The only way to determine an ore type of a given tile is to mine sufficiently deep. Different ores will require different depths of mining before locating any ores.

Players will start mining using a Fire Mining technique; workers will build a fire directly on bedrock. After the fire has heated the rock sufficiently, it will be smothered with water. The thermal shock will cause the rocks to crack. Hoes and other tools will be used to clear away stones and gravel, a crane is needed to lift the rocks out of the mine. Since fires can only be placed on the ground, Fire Mining can only dig straight down.

Mining will be filled with many dangers. Mining workers will need light at all times to move or work. Without sufficient airflow they will die. Cranes (to move workers and material to & from the surface) can fail, leading to death if not maintained.

## Biomes

The world map will have various types of biomes, which affects the tile sets available in the local map for that tile. The existing biome types are:

-   Plains (temperate, moderate-dry, normal)
-   Forests (temperate, moderate-wet, normal)
-   Desert (hot, dry, barren)
-   Swamp
-   Water
-   Jungle
-   Lavascape (this doesn't generate naturally, but is selected if the civilization type for that tile is Ork Tribe)
-   Frozen Waste (this doesn't generate naturally, but is selected if the civilization type for that tile is Ice Horrors)

Additional biome types can be added as well; we may include mixed-class biomes, such as part-plains part-forest, or other more exotic biome types. I would also like to incorporate hot / cold, wet / dry biome ranges into this, and possibly barren / lush and blighted / enchanted biome ranges as well. It could be viewed as a 4D terrain selection map

-   Hot, wet, barren, blighted: Goblin territories
-   Hot, wet, barren, normal: Steam-pitted scape
-   Hot, wet, barren, enchanted: Magical fire towers
-   Hot, wet, normal, blighted: tainted lands
-   Hot, wet, normal, normal: light jungle
-   Hot, wet, normal, enchanted: Enchanted Jungle
-   Hot, wet, lush, blighted: terribly tainted lands
-   Hot, wet, lush, normal: heavy jungle
-   Hot, wet, lush, enchanted:
-   Hot, damp, barren, blighted:
-   Hot, damp, barren, normal:
-   Hot, damp, barren, enchanted:

-   Blighted and Enchanted terrains will be less common than most

There should be a total of 4x4x3x3=144 different biomes, this way

## Civilizations

Non-player civilizations will be spread randomly across the map. I already have many types available, listed [here](server/globals.php). Currently the only difference between each type is the biomes they appear in, and how hostile they are to newcomers. Later (once I can actually write relevant code for them) players will be able to trade with them for certain goods, some of which are only available through trade.

The range of hostility to new players will have a major impact on how easily their map tiles can be explored. Friendly civilizations will invite explorers to trade with them, even sending explorers home with gifts. Hostile civilizations will kill any explorers they are able to, and can only be approached with an army of considerable size (or technology)

Civilizations will be given a strength value during world gen. This determines the number of tiles that this civilization covers (which also influences how much they can trade, defend themselves or attack others). The random number generator for this is set to generate negative numbers (which is then set to zero); Zero-strength civilizations will represent abandoned lands.

There are a lot of civilizations that can be generated. To see the full list and stats on them, look in server/globals.php for the array `$civData`. ...well, there's only a description, and a few have images. More stats will be generated when they become relevant in the code.
