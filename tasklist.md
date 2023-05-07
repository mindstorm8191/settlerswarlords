## Task List for Settlers & Warlords

1.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
2.  Do the fix for the Carousel, and see if that corrects the issue - which is, the setTimeout calls stop matching up with the normal running time variables when the user is looking at other webpages for a while. The fix for this is to switch to using the running time variables exclusively.
3.  Do more to verify that the saving code is functioning correctly with the task changes
4.  Create the artwork for any remaining items that occur on game startup. From here we'll add new items as they become available
5.  Add a World Map button, and start working on the world map view
6.  Get units to be able to explore neighboring world map tiles. They'll need to take food, but we don't have any options of that yet.
7.  Keep exploring the world map until we locate NPC civilizations. We'll need to create some artwork for those
8.  Add a tick function to the Lean-To, to have its lifetime decay while in use. Have the game's tick call every block's tick function, but only if that function exists
9.  Figure out how workers will forage for food, with the new system. I don't want workers to continue finding random scraps around the map, but to locate edible items that are actually on the map. Maybe we can have the vegetable plots producing edible foods that will be consumed (they can collect crops for farming from other map tiles).
10. Start designing the new task control system from here
    -   Tasks should automatically locate all items needed for its operation. Assume all tasks will need this to run, unless the lists are empty
    -   Tasks will only have two possible locations: at the structure's site, or at a location holding a target item
    -   Forage Post tasks will only consist of bringing items to the Post (some moves will fail when a worker arrives there). This structure should be designed around the new system better; we might be better off waiting to add this structure later, anyway.
    -   Tasks will group tools and items into the same list. The task won't be able to be started until all items are at the job site.
11. Add a Rock Knapper structure and get Flint Knives and Flint Stabbers built.
12. Add a Loggers Post, and allow players to collect bark shavings for making twine.
13. Build a Twine Maker and produce small ropes
