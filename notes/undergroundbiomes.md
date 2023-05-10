# Underground Biomes

### Plans
- Dwarf Fortress had several layers of underground biomes. We could achieve the same thing; deeper underground biomes would be more dangerous and lively
- Save tree growth for the deeper biomes only; higher biomes won't support them (without human intervention)
- Many plants will grow right on top of ores, which gives them unique qualities. Many animals will seek these plants for their nutrition
- Plants which rely on radiation from around then would probably grow in much different patterns than surface plants
- We might have 1 or 2 plants that will grow underground or on the surface; they will be hybrid plants that can feed from either source. They will mostly be found in ravines, where any other plants don't do so well
- All underground biomes will rely on ambient heat and (maybe) radiation to fuel them. Deeper biomes will provide more radiation
- Players will be able to mine radioactive ores and minerals, and use it fuel man made gardens that can be built anywhere. Concentrated radiation sources will work as well, but need dangerous to handle, of course

### Implementation Strategy
- Need to determine what ores general at what depths; We could stack multiple ore types on the same map
- Stick with max 3 chasms per map, but 1 or 2 might generate instead
- Plants generated will be based on ores present. We might have only 1 or 2 plant types per ore, resulting in 1-2 per chasm; I might want more plant variety than that
- Also need to determine how deep these chasms will start from. It'll likely need decided on gameplay results
- With current 2D underground map, players may have a hard time getting from the chasm ceiling to its floor. We may need to provide construction devices for that, built out of wood. This may be easier if/when we switch to 3D maps
- Facts about underground biomes won't be sent to the client until until they have been accessed. Most of this will be stored in the database, though
