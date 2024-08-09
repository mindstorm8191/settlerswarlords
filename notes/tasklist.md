## Task List for Settlers & Warlords

1.  Modify the client-side map loading code to gradually check larger and larger areas around the player. We want to load a lot of content, but focus on nearby portions first.
    -   Come up with a way to expand the search range by x and z values, not y.
    -   Figure out a way to load spaces that the player has built things on. Players will need their entire base areas to be fully running when they play
2.  Keep thinking on how to enhance map generation
    -   We will probably need to generate biome content based on the chunk sizes we have now, and reference it as needed.
    -   This could be a two layer system. Large biomes affect tiles available in micro biomes.
    -   It'll be fine for now if micro biome sections come in 8x8 squares
    -   Work on placing unique forage on the tiles. Tile display will depend more on Flooring type than the whole block. We will need this as we unlock farming
    -   Along with tile forage values, we can consider adding bushes to the game, too
3.  Get the player to start moving around with keyboard controls. Allow them to explore the world
4.  Get trees to generate on the current map. Most trees will be 3 tiles tall and include wider areas for branches
5.  Add workers around the player. They'll be idle when the game begins
6.  Allow players to build a lean-to. These must be placed beside a tree trunk. We may decide to go with the menu based item selection that Factorio does
7.  Add a Rock Knapper, and allow workers to complete work there. Remember that these should only allow one recipe to be completed in them.
8.  Work on adding additional players to an existing game map. We will need to space them out sufficiently; maybe 40 chunks will do
9.  Add additional fields to chunks, including pollution. Players won't be able to generate pollution until they can run fires. Trees will absorb pollution.
    -   Pollution will rise only so high, but will spread out more than rise.
    -   We could have different properties to pollution, based on what is released into the air
    -   High pollution levels should slow plant growth, or kill it off if too high
10. On the server side, wrap the code that validates users into a common function. Use it to also check when a user's session has expired, so we can have them log in again.

Later objectives

1.  Update player movement. When players are moving diagonally, reduce movement a little bit in both directions so that diagonal movements are 1 speed, not 1.44 speed
2.  Set up a mini-banner of some kind, so we can use more of the screen space for content. The normal banner will show before users log in, then we can switch after

Tasks complete (because it helps to see what you've already accomplished)

1.  Modify the front-end map management system to use a 3D tiles array, instead of a flat list of tiles
2.  Put a player on the map
3.  Set up a system to transfer a task list between the project and Notion, so I don't have multiple lists that don't match
4.  Built the map loading code. Had troubles with sequential fetches losing previously-loaded content, but got it resolved

Old task list

9.  Make the game easier to transition through version changes.
    -   Have each local map generate with a new RNG key. We will keep that key as part of the map's basic data
10. Start working toward population growth being dependent on food supply. We will have a food count from the map to start with. The player won't gain population until they have exceeded this by X amount.
11. Start working on tiles regenerating content. We need a way to allow tiles to regenerate all the way back to their original states, without generating too much overhead data (that must be passed back & forth to the server).
    -   Structures will have a flag to determine if they will block natural regrowth. So far the only structure to block it is the Campfire and Open Dryer. When a building is removed (or decays and is deleted), we will update the map tile data
    -   Tiles will each have a single regrowth object. It will track how many of every item it should have when it finishes. All blocks will start with this from game start.
    -   Find all the places that modify a tile's items, and generate a map update instance there
12. Regrowth: When everything is functioning correctly, 'flatten out' the data structure. We should have the match level be a separate field. And since this content never changes, we can avoid sending it back on every save
13. Figure out how to handle worker hydration, since we have food consumption working now.
14. Show workers where-ever they are on the map. We need to show additional details of their actions here
15. On the task assignment process, allow users to specify what type of product to use as input for specific tasks. This process should mark unavailable items with red text
16. Hay Dryer: Determine a way to limit the number of drying hay items to 30. I don't think we have an easy way to prevent tasks from moving items to the structure, but we can stop adding them to the list of drying elements after a certain point. These items should not be added to the structure's task (so that they can be moved to another structure, if desired).
17. Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
18. Create the artwork for any remaining items that occur on game startup. From here we'll add new items as they become available
19. Get the tutorial mode (and its display setting) to save to the database, so that users don't have to see it again.
20. Worker food: See if we can get workers to check for food at the Forage Post before trying to find food elsewhere on the map
21. Forage Post: This may be a good opportunity to allow players to set a minimum quantity of food items, and auto-generate tasks when that count is below that number.
22. Campfire: Have the fire temperature decay faster when it is very high; above 225 or 250 it should start decreasing rate; probably never get above 350 degrees. Might want to reduce operating times for logs, as well, but I'm not sure
23. Campfire: Add a toggle on the SidePanel to allow players to cook only butchered meat, or all available meats
24. Campfire: Adjust how the displayed values are shown. Instead of specific numbers, we should show temps like moderate, warm, hot, extreme. Instead of fueltime, show temperature trends as either warming or cooling. Cook time should be a percentage of the current product's cooking progress.
25. Continue working on localmap ticking
    -   Every 'local map event' will have a tick value associated with it
    -   The game object will hold a value to know which tick event takes place next. No action will be taken until that tick event point is reached
    -   Once the tick event is processed, the game will search all tiles for the next tick event in the sequence
    -   Local map events won't generate until the player has done something to the map. Workers moving around count in this
    -   Every tile will have a traveldamage value. It will increase by 3 minutes each time a worker walks across it.
26. World map: We will still need a pathfinding routine on the server, no matter what. Have the client request a route from the server, to reach a specific tile. Call the code-route getpath. The sendunits code will expect a path string
27. World map: When a player sends units out to other tiles, use the same request to decide which worker is being sent on the journey
28. World map: Have a means to show active troops traveling on the world map. This will be approximated based on a player's limited information, instead of the actual information. For example, if the troops are sent 5 tiles out, get attacked in tile 2 and return, the player will believe they are still traveling out, until they arrive back home again.
29. World map: Start showing NPC civilizations on the map, as they are found. We will need artwork for this...
30. World map: Create a means to generate pathfinding between points on the world map. The generated path will ultimately be used on the server end, but we also want to show the path to the user; so it'll help if we can generate it on the client side. At the same time, events can happen on the server side to remote troops, causing them to need to reroute or return home, so we need to be able to do it on the server side as well.
31. World map: Once pathfinding is complete, start to calculate the distance to reach target tiles
32. Lean-to: Add a tick function to have the Lean-to's lifetime decay while in use. Have the game's tick call every block's tick function, but only if that function exists
33. Check that all task types has an outputItems field (if it outputs items).

### Database Changes

This list is to ensure that we remember how to update the online copy of the game, whenever we update it

-   sw_player: Add field tutorialState as an int
-   sw_minimap: Add field regrowth as text
