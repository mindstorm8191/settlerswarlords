## Task List for Settlers & Warlords

1.  Ensure that land types are saved to the server, whenever they are updated
2.  Hay Dryer: Get the local map tick to save to the server, and reloaded upon game load
3.  Hay Dryer: Figure out why the Hay at the Hay Dryer is losing its inTask value
4.  Hay Dryer: Determine a way to limit the number of drying hay items to 30. I don't think we have an easy way to prevent tasks from moving items to the structure, but we can stop adding them to the list of drying elements after a certain point. These items should not be added to the structure's task (so that they can be moved to another structure, if desired).
5.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
6.  Do the fix for the Carousel, and see if that corrects the issue - which is, the setTimeout calls stop matching up with the normal running time variables when the user is looking at other webpages for a while. The fix for this is to switch to using the running time variables exclusively.
7.  Do more to verify that the saving code is functioning correctly with the task changes
8.  Create the artwork for any remaining items that occur on game startup. From here we'll add new items as they become available
9.  Get the tutorial mode (and its display setting) to save to the database, so that users don't have to see it again.
10. Put some ideas together about the history of the world. We should have lots of ancient stone relics, some grounds where battles were fought (and weapons & armor left behind), and other things.
11. Forage Post: All workers will need a new attribute: a food counter. This will decrease every game-tick. At a certain point, workers will take it upon themselves to go find more food, and eat it. They'll likely search at the Forage Post before looking for some in the wild
12. Forage Post: This may be a good opportunity to allow players to set a minimum quantity of food items, and auto-generate tasks when that count is below that number.
13. Set up localmap ticking
    -   Everything will be controlled by a tick number, which will increase 20 times per second. This value needs to be saved to the database
    -   Every 'local map event' will have a tick value associated with it
    -   The game object will hold a value to know which tick event takes place next. No action will be taken until that tick event point is reached
    -   Once the tick event is processed, the game will search all tiles for the next tick event in the sequence
    -   Local map events won't generate until the player has done something to the map. Workers moving around count in this
14. Figure out why tasks are becoming de-coupled from the worker that started them
15. Fix bug: When tasks are assigned more than one quantity, tasks fail after first one. May be related to items being tagged and then removed. We will need to reset our item search, somehow
16. World map: When a player sends units out to other tiles, use the same request to decide which worker is being sent on the journey
17. World map: Have a means to show active troops traveling on the world map. This will be approximated based on a player's limited information, instead of the actual information. For example, if the troops are sent 5 tiles out, get attacked in tile 2 and return, the player will believe they are still traveling out, until they arrive back home again.
18. World map: Start showing NPC civilizations on the map, as they are found. We will need artwork for this...
19. World map: Create a means to generate pathfinding between points on the world map. The generated path will ultimately be used on the server end, but we also want to show the path to the user; so it'll help if we can generate it on the client side. At the same time, events can happen on the server side to remote troops, causing them to need to reroute or return home, so we need to be able to do it on the server side as well.
20. World map: Once pathfinding is complete, start to calculate the distance to reach target tiles
21. Lean-to: Add a tick function to have the Lean-to's lifetime decay while in use. Have the game's tick call every block's tick function, but only if that function exists
22. Hay Dryer: Have unit refer to existing hay-drying tiles before trying to search for a new one. The hay limit should be set to 30
23. Allow the Farmer's Post to separate seeds from straw (when given dried hay), using a Flint Knife
24. Use the Farmer's Post to generate thatch shingles from 1 string and 10 straw
