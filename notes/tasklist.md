## Task List for Settlers & Warlords

1.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
2.  Do the fix for the Carousel, and see if that corrects the issue - which is, the setTimeout calls stop matching up with the normal running time variables when the user is looking at other webpages for a while. The fix for this is to switch to using the running time variables exclusively.
3.  Do more to verify that the saving code is functioning correctly with the task changes
4.  Create the artwork for any remaining items that occur on game startup. From here we'll add new items as they become available
5.  Get the tutorial mode (and its display setting) to save to the database, so that users don't have to see it again.
6.  Get the unlockedItems list to save to the database, and load again when the game resumes
7.  Put some ideas together about the history of the world. We should have lots of ancient stone relics, some grounds where battles were fought (and weapons & armor left behind), and other things.
8.  When a player sends units, get the response to update the world map (correctly). We no longer need to process a newly created event or the traveller data
9.  When a player sends units out to other tiles, use the same request to decide which worker is being sent on the journey
10. Set up pathfinding for workers as they cross the world map
11. Have a means to show active troops traveling on the world map. This will be approximated based on a player's limited information, instead of the actual information. For example, if the troops are sent 5 tiles out, get attacked in tile 2 and return, the player will believe they are still traveling out, until they arrive back home again.
12. Start showing NPC civilizations on the map, as they are found. We will need artwork for this...
13. Create a means to generate pathfinding between points on the world map
14. Add a tick function to the Lean-To, to have its lifetime decay while in use. Have the game's tick call every block's tick function, but only if that function exists
15. Figure out how workers will forage for food, with the new system. I don't want workers to continue finding random scraps around the map, but to locate edible items that are actually on the map. Maybe we can have the vegetable plots producing edible foods that will be consumed (they can collect crops for farming from other map tiles).
16. Start working on the Forage Post. Its tasks will only consist of bringing items to the Post (some moves will fail when a worker arrives there). This structure should be designed around the new system better
17. Build a Rope Maker and produce small ropes
