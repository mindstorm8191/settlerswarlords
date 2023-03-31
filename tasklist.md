## Task List for Settlers & Warlords

1.  Use Gimp to create a paper texture for showing the Blog on the front page. We can use new textures and effects as the game's tech progresses.
2.  Do the fix for the Carousel, and see if that corrects the issue - which is, the setTimeout calls stop matching up with the normal running time variables when the user is looking at other webpages for a while. The fix for this is to switch to using the running time variables exclusively.
3.  Save the existing structures (only the lean-to) and ensure it can be loaded again
4.  Save the existing tasks and ensure they can be loaded again. This may require preventing workers from gaining tasks, momentarily
5.  Save existing workers, even when they have tasks assigned to them.
6.  Get workers to complete work when they reach their destination
7.  Build the workers out into a proper class-type system with its own management functions
8.  Start designing the new task management system.
9.  Get the lean-to to declare a construction task automatically. Start designing the new task control system from here
    -   Tasks should automatically locate all items needed for its operation. Assume all tasks will need this to run, unless the lists are empty
    -   Tasks will only have two possible locations: at the structure's site, or at a location holding a target item
    -   Forage Post tasks will only consist of bringing items to the Post (some moves will fail when a worker arrives there). This structure should be designed around the new system better; we might be better off waiting to add this structure later, anyway.
    -   Tasks will group tools and items into the same list. The task won't be able to be started until all items are at the job site.
10. Add a Rock Knapper structure and get Flint Knives and Flint Stabbers built.
11. Add a Loggers Post, and allow players to collect bark shavings for making twine.
12. Build a Twine Maker and produce small ropes
