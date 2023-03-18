## Task List for Settlers & Warlords

1.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
2.  Do the fix for the Carousel, and see if that corrects the issue - which is, the setTimeout calls stop matching up with the normal running time variables when the user is looking at other webpages for a while. The fix for this is to switch to using the running time variables exclusively.
3.  Get buildings to be placeable on the map again. We should allow for dragging and dropping fo buildings, as it is the most natural way to place them.
4.  Get the lean-to to declare a construction task automatically. Start designing the new task control system from here
    -   Tasks should automatically locate all items needed for its operation. Assume all tasks will need this to run, unless the lists are empty
    -   Tasks will only have two possible locations: at the structure's site, or at a location holding a target item
    -   Forage Post tasks will only consist of bringing items to the Post (some moves will fail when a worker arrives there). This structure should be designed around the new system better; we might be better off waiting to add this structure later, anyway.
    -   Tasks will group tools and items into the same list. The task won't be able to be started until all items are at the job site.
5.  Add a Rock Knapper structure and get Flint Knives and Flint Stabbers built.
6.  Add a Loggers Post, and allow players to collect bark shavings for making twine.
7.  Build a Twine Maker and produce small ropes
