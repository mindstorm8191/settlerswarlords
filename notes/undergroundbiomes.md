# Underground Biomes

### Plans

-   Dwarf Fortress had several layers of underground biomes. We could achieve the same thing; deeper underground biomes would be more dangerous and lively
-   Save tree growth for the deeper biomes only; higher biomes won't support them (without human intervention)
-   Many plants will grow right on top of ores, which gives them unique qualities. Many animals will seek these plants for their nutrition
-   Plants which rely on radiation from around then would probably grow in much different patterns than surface plants
-   We might have 1 or 2 plants that will grow underground or on the surface; they will be hybrid plants that can feed from either source. They will mostly be found in ravines, where any other plants don't do so well
-   All underground biomes will rely on ambient heat and (maybe) radiation to fuel them. Deeper biomes will provide more radiation, and life
-   Players will be able to mine radioactive ores and minerals, and use it fuel man made gardens that can be built anywhere. Concentrated radiation sources will work as well, but will be dangerous to handle, of course

### Implementation Strategy

-   Need to determine what ores general at what depths; We could stack multiple ore types on the same map
-   Stick with max 3 chasms per map, but 1 or 2 might generate instead
-   Plants generated will be based on ores present. We might have only 1 or 2 plant types per ore, resulting in 1-2 per chasm; I might want more plant variety than that
-   Also need to determine how deep these chasms will start from. It'll likely need decided on gameplay results
-   With current 2D underground map, players may have a hard time getting from the chasm ceiling to its floor. We may need to provide construction devices for that, built out of wood. This may be easier if/when we switch to 3D maps
-   Facts about underground biomes won't be sent to the client until until they have been accessed. Most of this will be stored in the database, though

### Exploration

-   Cave diving should be a thing; local maps should occasionally generate cave entrances, which even early players can enter. They will only need to craft torches before doing so.
-   Cave divers will need to operate as a team, being sent down with objectives which can result in success or failure. Caves (and mines) will have many dangers; squads can be sent down with weapons for fending off threats. Spare torches and food & water will need to be taken, as well.
-   Players will need to explore caves in sections. Deeper portions of a cave will take longer to get to. Once explored, existing resources will be known and can be mined (with the correct tools)
-   Cave divers can encounter existing structures during their travels. Some sections may contain treasures, or existing occupants (not always the original) to fight against, and deadly traps aimed at keeping invaders out.
-   Cave divers will be limited by how deep they can go, based on oxygen levels within the caves / mines. Extra oxygen sources can be carried along, once oxygen storage capabilities become possible. Light sources other than torches will also become necessary (low oxygen doesn't allow torches to burn).
