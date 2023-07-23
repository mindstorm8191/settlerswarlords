## Task List for Settlers & Warlords

1.  Make the game easier to transition through version changes.
    -   Have each local map generate with a new RNG key. We will keep that key as part of the map's basic data
2.  Show workers where-ever they are on the map. We need to show additional details of their actions here
3.  Determine what extra parts will be needed before we can have tools break during usage
4.  On the task assignment process, allow users to specify what type of product to use as input for specific tasks. This process should mark unavailable items with red text
5.  Hay Dryer: Determine a way to limit the number of drying hay items to 30. I don't think we have an easy way to prevent tasks from moving items to the structure, but we can stop adding them to the list of drying elements after a certain point. These items should not be added to the structure's task (so that they can be moved to another structure, if desired).
6.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
7.  Create the artwork for any remaining items that occur on game startup. From here we'll add new items as they become available
8.  Get the tutorial mode (and its display setting) to save to the database, so that users don't have to see it again.
9.  Forage Post: All workers will need a new attribute: a food counter. This will decrease every game-tick. At a certain point, workers will take it upon themselves to go find more food, and eat it. They'll likely search at the Forage Post before looking for some in the wild
10. Forage Post: This may be a good opportunity to allow players to set a minimum quantity of food items, and auto-generate tasks when that count is below that number.
11. Campfire: Have the fire temperature decay faster when it is very high; above 225 or 250 it should start decreasing rate; probably never get above 350 degrees. Might want to reduce operating times for logs, as well, but I'm not sure
12. Campfire: Add a toggle on the SidePanel to allow players to cook only butchered meat, or all available meats
13. Campfire: Adjust how the displayed values are shown. Instead of specific numbers, we should show temps like moderate, warm, hot, extreme. Instead of fueltime, show temperature trends as either warming or cooling. Cook time should be a percentage of the current product's cooking progress.
14. Continue working on localmap ticking
    -   Every 'local map event' will have a tick value associated with it
    -   The game object will hold a value to know which tick event takes place next. No action will be taken until that tick event point is reached
    -   Once the tick event is processed, the game will search all tiles for the next tick event in the sequence
    -   Local map events won't generate until the player has done something to the map. Workers moving around count in this
    -   Every tile will have a traveldamage value. It will increase by 3 minutes each time a worker walks across it.
15. World map: We will still need a pathfinding routine on the server, no matter what. Have the client request a route from the server, to reach a specific tile. Call the code-route getpath. The sendunits code will expect a path string
16. World map: When a player sends units out to other tiles, use the same request to decide which worker is being sent on the journey
17. World map: Have a means to show active troops traveling on the world map. This will be approximated based on a player's limited information, instead of the actual information. For example, if the troops are sent 5 tiles out, get attacked in tile 2 and return, the player will believe they are still traveling out, until they arrive back home again.
18. World map: Start showing NPC civilizations on the map, as they are found. We will need artwork for this...
19. World map: Create a means to generate pathfinding between points on the world map. The generated path will ultimately be used on the server end, but we also want to show the path to the user; so it'll help if we can generate it on the client side. At the same time, events can happen on the server side to remote troops, causing them to need to reroute or return home, so we need to be able to do it on the server side as well.
20. World map: Once pathfinding is complete, start to calculate the distance to reach target tiles
21. Lean-to: Add a tick function to have the Lean-to's lifetime decay while in use. Have the game's tick call every block's tick function, but only if that function exists
22. Check that all task types has an outputItems field (if it outputs items).
