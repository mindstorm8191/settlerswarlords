# Settlers & Warlords - Map Generation

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

-   Plains
-   Forests
-   Desert
-   Swamp
-   Water
-   Jungle
-   Lavascape (this doesn't generate naturally, but is selected if the civilization type for that tile is Ork Tribe)
-   Frozen Waste (this doesn't generate naturally, but is selected if the civilization type for that tile is Ice Horrors)
    Additional biome types can be added as well; we may include mixed-class biomes, such as part-plains part-forest, or other more exotic biome types.

## Civilizations

Non-player civilizations will be spread randomly across the map. I already have many types available. Currently the only difference between each type is the biomes they appear in, and how hostile they are to newcomers. Later (once I can actually write relevant code for them) players will be able to trade with them for certain goods, some of which are only available through trade.

The range of hostility to new players will have a major impact on how easily their map tiles can be explored. Friendly civilizations will invite explorers to trade with them, even sending explorers home with gifts. Hostile civilizations will kill any explorers they are able to, and can only be approached with an army of considerable size (or technology)

Civilizations will be given a strength value during world gen. This determines the number of tiles that this civilization covers (which also influences how much they can trade, defend themselves or attack others). The random number generator for this is set to generate negative numbers (which is then set to zero); Zero-strength civilizations will represent abandoned lands.
