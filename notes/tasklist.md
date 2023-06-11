## Task List for Settlers & Warlords

1.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
2.  Do the fix for the Carousel, and see if that corrects the issue - which is, the setTimeout calls stop matching up with the normal running time variables when the user is looking at other webpages for a while. The fix for this is to switch to using the running time variables exclusively.
3.  Do more to verify that the saving code is functioning correctly with the task changes
4.  Create the artwork for any remaining items that occur on game startup. From here we'll add new items as they become available
5.  Get the tutorial mode (and its display setting) to save to the database, so that users don't have to see it again.
6.  Put some ideas together about the history of the world. We should have lots of ancient stone relics, some grounds where battles were fought (and weapons & armor left behind), and other things.
7.  Figure out why tasks are becoming de-coupled from the worker that started them
    -   We can go ahead and check that the task is successfully deleted on the worker's side. If not, remove it from the worker anyway
8.  Items are losing their associated tasks after save & load
    -   Items aren't being saved with thier inTask property
9.  Fix bug: When tasks are assigned more than one quantity, tasks fail after first one. May be related to items being tagged and then removed. We will need to reset our item search, somehow
10. Update the game-load code to run through all existing tasks to pick an appropriate next-task ID
11. Set up a water source so we can fill wooden buckets with water. Use the same structure to mix 5 dirt balls & 1 water bucket to get 1 clay ball
12. When a player sends units out to other tiles, use the same request to decide which worker is being sent on the journey
13. Set up pathfinding for workers as they cross the world map
14. Have a means to show active troops traveling on the world map. This will be approximated based on a player's limited information, instead of the actual information. For example, if the troops are sent 5 tiles out, get attacked in tile 2 and return, the player will believe they are still traveling out, until they arrive back home again.
15. Start showing NPC civilizations on the map, as they are found. We will need artwork for this...
16. Create a means to generate pathfinding between points on the world map
17. Add a tick function to the Lean-To, to have its lifetime decay while in use. Have the game's tick call every block's tick function, but only if that function exists
18. Figure out how workers will forage for food, with the new system. I don't want workers to continue finding random scraps around the map, but to locate edible items that are actually on the map. Maybe we can have the vegetable plots producing edible foods that will be consumed (they can collect crops for farming from other map tiles).
19. Start working on the Forage Post. Its tasks will only consist of bringing items to the Post (some moves will fail when a worker arrives there). This structure should be designed around the new system better
