## Task List for Settlers & Warlords

1.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
2.  Do the fix for the Carousel, and see if that corrects the issue - which is, the setTimeout calls stop matching up with the normal running time variables when the user is looking at other webpages for a while. The fix for this is to switch to using the running time variables exclusively.
3.  Do more to verify that the saving code is functioning correctly with the task changes
4.  Create the artwork for any remaining items that occur on game startup. From here we'll add new items as they become available
5.  Get the tutorial mode (and its display setting) to save to the database, so that users don't have to see it again.
6.  Put some ideas together about the history of the world. We should have lots of ancient stone relics, some grounds where battles were fought (and weapons & armor left behind), and other things.
7.  Get the forage post working
    -   All workers will need a new attribute: a food counter. This will decrease every game-tick. At a certain point, workers will take it upon themselves to go find more food
8.  Set up localmap ticking
    -   Everything will be controlled by a tick number, which will increase 20 times per second. This value needs to be saved to the database
    -   Every 'local map event' will have a tick value associated with it
    -   The game object will hold a value to know which tick event takes place next. No action will be taken until that tick event point is reached
    -   Once the tick event is processed, the game will search all tiles for the next tick event in the sequence
    -   Local map events won't generate until the player has done something to the map. Workers moving around count in this
9.  Figure out why tasks are becoming de-coupled from the worker that started them
10. Fix bug: When tasks are assigned more than one quantity, tasks fail after first one. May be related to items being tagged and then removed. We will need to reset our item search, somehow
11. When a player sends units out to other tiles, use the same request to decide which worker is being sent on the journey
12. Set up pathfinding for workers as they cross the world map
13. Have a means to show active troops traveling on the world map. This will be approximated based on a player's limited information, instead of the actual information. For example, if the troops are sent 5 tiles out, get attacked in tile 2 and return, the player will believe they are still traveling out, until they arrive back home again.
14. Start showing NPC civilizations on the map, as they are found. We will need artwork for this...
15. Create a means to generate pathfinding between points on the world map
16. Add a tick function to the Lean-To, to have its lifetime decay while in use. Have the game's tick call every block's tick function, but only if that function exists
17. Figure out how workers will forage for food, with the new system. I don't want workers to continue finding random scraps around the map, but to locate edible items that are actually on the map. Maybe we can have the vegetable plots producing edible foods that will be consumed (they can collect crops for farming from other map tiles).
18. Start working on the Forage Post. Its tasks will only consist of bringing items to the Post (some moves will fail when a worker arrives there). This structure should be designed around the new system better
