# Settlers & Warlords Worker Crafting Strategy

Workers in this game will be able to automatically craft many items, even if the prerequisite items don't exist yet. For example, if they are trying to craft a flint spear, for example, this tool needs a long stick and some twine before it can be crafted.

Their first task will be to go find a long stick. If one doesn't exist, they will go make one at the Lumberjack's Post. If the Lumberjack's Post doesn't have a Flint Stabber (or better tool) available, they will first go to the Flint Tool Maker and create one. Now that they have one, they can go cut a Long Stick, then take it to the Flint Tool Maker. This same process will happen with collecting the Twine. They can then go craft the Flint Spear (and use it for whatever task they needed it for).

None of this code works yet, though. It still needs to be made, and the earliest buildings using this haven't been added - we will get there soon, I think!

My intention to make this work is for workers to build up a task queue. Workers will first request work from a building (eg 'fetch long stick'). Being unable to find one, they then search for a building that can produce a Long Stick (eg the Loggers Post). This leaves two tasks on the worker's queue, with crafting the long stick first (and being done first). Once the long stick is complete, its task will be removed, and the worker will go back to crafting the Flint Spear.

Hopefully this method will allow workers to queue up any number of subtasks to get a specific job done. This may leave said worker busy for a long time, but eventually they'll achieve their goal! It will be the player's job to set workers to tasks that can be completed easily by using other workers to fill in these sub-tasks.
