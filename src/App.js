import React from "react";
import "./App.css";

import { DAX } from "./libs/DanAjax.js"; // A library to make Fetch calls a little easier
import { DanLog } from "./libs/LogManager.jsx";

import { game } from "./game.jsx";

import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { LocalMap } from "./comp_LocalMap.jsx";
import { ShowBlog } from "./libs/ShowBlog.jsx";

/* Task List
1) Look into adding logging of the game's progression, to be saved on the database. This will only be active in development mode. We'll have
    to figure out ways to use this effectively to track down phantom bugs
    a) use logging levels. Important things should be kept from common things
    b) Display full objects in the logs. Have a way to output objects in json-able formats, which basically means converting object
        references to object IDs
2) In worldgen, add items to the new vegetable tiles; they currently contain nothing
1) Allow the tutorial mode to be saved to the server. We currently have no method to update the tutorial state yet.
1) Fix bug: Forage Post does not remain enabled after save & reload. I think it's because the state is being converted to a string, but
    (for some reason) I'm still able to re-enable it.
1) Continue working on loading a game. Next is to associate all tasks to the correct workers and buildings. We also need to associate
   all items (found in tiles and workers) to the correct tiles. That might be enough
1) Some tree types don't provide logs. We need a way that, when log chunks are needed, any trees that won't produce logs won't be included in
    potential locations
1) Find a solution for the bug that puts the tutorial portion in the wrong place in production mode
2) Create a structure to add dirt to water buckets and filter out the clay
3) Allow a flint scythe to be crafted, and then clear out grasses. Use a Kitchen to separate the straw from the grain, using a knife
4) Use a straw drying building to allow straw to be dried out
3) Assign skill points for each task completed. Have workers gain skill points when tasks get completed
4) Have idle workers, when they find a task to complete, check other idle workers to see if they have better skills for the job
5) Have items get a quality value based on the skill used to craft each item
4) Come up with a better way to report failure if a task can't be completed. We may grey out options based on needing items before-hand. Or
    maybe show a queue of tasks that need completing before the target task can be done.

1) Set up a means to post sound-effect boxes on the map; for example 'TIMBER!' when a tree falls down, or 'CRACK!' when the fire miner
    douses its fire, etc
2) Set up a useTool() function, as part of the worker class, to manage tool wear automatically.
3) Decide if a hasTools() function is needed. I think the pre-check for parts will catch that a tool is missing (because it broke), even
    midway through a task
1) Decide how to better show workers when a user has clicked on their tile
2) Provide a drop-down list (or something) at the top of the page showing workers, and scroll over to them when selected

Things to add later
* Finish adding the single-tile vegetables to the game. We forgot to include squash. We'll also need vegetables for other biomes, like
    the desert
* We need some buildings to be able to be equipped with items. For example, the rope maker could be equipped with rope turning tools
* A task's FindLocation function should really return an object, so it can better portray failures
* All items should have a quality level, that is affected by the skill level of the person who crafted it. Items crafted by high-quality base
    items will result in higher quality finished items. The skill of the crafter will increase its quality as well. Each job completed will
    increase the worker's XP of that skill
* Allow players to acquire tools & items without having them unlocked
1) Add bush types to localmap worldgen: blueberry, grape, Firethorn, Buckthorn, Agarita, Gooseberry
2) Have workers follow A* pathfinding for fastest route to their destinations. This also means pathfinding considerations to locate things
    workers can pick up.
3) Have item searches be based on A* pathfinding, so a worker will go after the item closest to them based on actual time needed to reach it.
3) Modify tree & bush placements to consider non-crossable paths due to thorns or overgrowth. Players will be able to clear these to make worker
    travel easier.
5) Add cotton to the game, in some way. Cotton cannot be harvested until leather gloves and other clothes are available.
6) Give all workers a health, nourishment, strength & speed values. Also include attack and armor values that can be modified by equipment.
7) Add wine to the game

Wine
Wine will be an important item in early tech. Not only is it a very safe form of hydration, it can be stored long term and travels easily. Some
players will be lucky and find grape vines growing on their map.
Tech pre-reqs
Players must be able to produce ceramic jars (from clay) and be able to cut wood logs (for a smashing bowl).
Process
1) Pick the grapes, then smash them. The simplest method is stomping on them with bare feet. A smashing bowl can be cut from a log chunk,
    1 per log (only 1 is needed).
2) Ferment the juices. Unwashed grapes have a 1 in 5 chance of fermenting into wine instead of crude vinegar. Juices can be poured into jars and
    capped loosely (to let CO2 escape but keep bugs out).
3) After 2 hours of gameplay time, wine is ready for use. It can be poured into other jars or containers. Jars that produce wine will become wine
    jars and will keep producing wine when used (Yeast will remain usable from the jars). Jars that produce vinegar will become vinegar jars; they
    can be used for other jobs.

Tanning process
* Tanning is done using a tannin solution. Tannins are leached from certain barks, or certain seeds. Most seeds containing tannins are non-edible;
    some of those are still non-edible after leaching the tannins. Tannins can be extracted by boiling the source materials (this will require
    clay pots / jars / buckets)
* Tannins will need to be concentrated to a sufficient level. We will combine 8 jars worth of tannin solution to get concentrated tannin solution
* Leave the animal skins in the tannin solution for 6-12 months; we'll count this as 1 hour of gameplay

Metal properties (to look up)
Tensile stress (pulling apart)
Compressive stress (crushing)
Shear (pushing side to side)
Malleability - how easy it is to change its shape
Toughness - how well it handles impacts
Hardness - how well it avoids plasticity deformations
Fatigue resistance - how long it lasts under regular stresses
    these should work out to new properties for armor and weapons
bendability
blade sharpness
impact strength
puncture resistance
cutting resistance
tearing resistance
impact absorbsion

Fantasy horror creature: https://imgur.com/gallery/s8E9idW

Maybe we need to de-couple jobs from workers.
Previously I was having workers pick jobs themselves to complete. That left too little control over activities for players to interact.
We will still have players choosing what is made, but workers will be picked automatically when they become available.
Process
1) User places a building. If it requires construction, a build task will be generated automatically.
2) Task options will be listed, and under it, current tasks and who is working it (if anyone)
3) User can create a new task at any time, specifying how much of an item to produce as well. This will be put into a task queue.
4) When a worker has no work, they will pick up a job to complete, and go do it. Their name will show up in the active tasks of that building
    - A task list will be available, and users can move existing tasks around. Tasks already being worked by workers can be put on hold (they
        will still have that task assigned to them), unassigned from the given worker, cancelled, or re-assigned to a specific worker

Project size (because it's fun to watch this grow)
src/App.js                               src/structures/RopeMaker.jsx            server/common.php                    server/routes/login.php           worldgen.md
    src/App.css                              src/structures/DirtSource.jsx           server/jsarray.php                  server/routes/logout.php          workercrafting.md
        src/libs/DanAjax.js                      src/structures/WaterSource.jsx          server/config.php                  server/routes/reporterror.php
           src/libs/LogManager.js                    src/structures/FarmersPost.jsx        server/DanGlobal.php                server/routes/save.php
              src/game.jsx                               src/comp_account.jsx                 server/finishLogin.php               server/routes/savelog.php
                  src/worker.jsx                             src/libs/DanInput.jsx               server/globals.php                   server/routes/savetiles.php
                      src/minimapTile.js                        src/libs/DanCommon.js                server/weightedRandom.php           server/routes/signup.php
                         src/structures/LeanTo.jsx                 src/libs/ErrorOverlay.jsx             server/getInput.php                 README.md worldgen.md
                             src/structures/ForagePost.jsx            src/comp_localMap.jsx                 server/mapContent.php               techtree.md
                                 src/strctures/RockKnapper.jsx            src/libs/DraggableMap.jsx             server/routes/autologin.php        automationtree.md
                                     src/structures/LoggersPost.jsx           src/libs/ShowBlog.jsx                server/routes/getblog.php          wartree.md
518+126+49+38+523+540+72+214+170+354+565+114+149+109+173+228+65+74+68+532+170+96+307+221+8+37+48+341+126+33+426+36+38+43+30+25+223+46+96+224+38+58+12+8+53+11
8/31/2022 = 3804 lines
9/5/2022 = 4365 lines
9/14/2022 = 4629 lines
10/5/2022 = 5158 lines
10/22/2022 = 5357 lines
12/24/2022 = 5530 lines
1/3/2023 = 5945 lines
1/9/2023 = 6259 lines
1/22/2023 = 6907 lines
1/29/2023 = 7435 lines
*/

// Accessing the server will work differently between if this project is in dev mode or in production mode.
// In Dev mode, since Create-React-App is running as a separate entity from the server, we will have to request
// content through a full URL (and work around CORS). Once the site is published, all this will be 'local' to the app
export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

// A simple little check to enable extra commands to help with debugging
export const debuggingEnabled = true;

/* *** Building project ***
   To build this project, run 'npm run build' from the command line.
   Note that you will need to change the homepage variable within package.json
*/

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [userData, setUserData] = React.useState(null);
    const [localStats, setLocalStats] = React.useState(null);
    const [localTiles, setLocalTiles] = React.useState(null);
    const [localWorkers, setLocalWorkers] = React.useState(null);
    const [loginError, setLoginError] = React.useState("");

    // Mobile display variables. If the page is already under 900 pixels wide, enable Mobile Mode
    const [mobileMode, setMobileMode] = React.useState(window.innerWidth > 900 ? false : true);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 900) {
                setMobileMode(true);
                game.mobileModeEnabled = true;
            } else {
                setMobileMode(false);
                game.mobileModeEnabled = false;
            }
            //setMobileMode(window.innerWidth <= 900);
            console.log("win-width " + window.innerWidth + ", mode=" + mobileMode);
        };
        window.addEventListener("resize", handleResize);
        return () => {
            // This will remove the event listener when we're done with it... which I guess is when the app is closed. Which I think wouldn't
            // really be necessary, but might as well keep it now
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Startup processes. We're primarily concerned about letting existing players log in automatically
    React.useEffect(() => {
        if (typeof localStorage.getItem("userid") == "object") return; // Do nothing if no data is in localStorage
        DanLog.setup(serverURL + "/routes/savelog.php");
        DanLog.add("src/App.js", "basic", { msg: "Test works" });
        fetch(
            serverURL + "/routes/autologin.php",
            DAX.serverMessage({ userid: localStorage.getItem("userid"), ajaxcode: localStorage.getItem("ajaxcode") }, false)
        )
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    setLoginError(data.message);
                    return;
                }
                // At this point, everything is handled the same as a normal login
                onLogin(data);
            });
    }, []);

    function onLogin(pack) {
        console.log(pack);

        if (pack === null) {
            // Receiving null means the user is trying to log out
            localStorage.removeItem("userid");
            localStorage.removeItem("ajaxcode");
            game.stopGame();
            setPage("HomePage");
            setUserData(null);
            setLocalStats(null);
            setLocalTiles(null);
            setLocalWorkers(null);
            //setWorldMap(null); // we need to clear this too, so the new user can load content
            return;
        }

        // Before we can get serious about running the game, we need to process some of the data received from the server
        // Right now, this only involves parsing JSON content from the items list at each tile
        pack.localTiles = pack.localTiles.map((ele) => {
            ele.items = JSON.parse(ele.items);
            return ele;
        });

        // Turn the worker data into objects. For new players, this will be relatively blank. This is now in the game object
        //pack.workers = game.prepWorkers(pack.workers);

        // Use localStorage to keep the user's ID & access code
        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

        game.setupGame(pack, setLocalTiles, setLocalWorkers);
        game.startGame();

        setUserData({ id: pack.userid, ajax: pack.ajaxcode });
        setLocalStats(pack.localContent);
        setLocalTiles([...game.tiles]);
        setLocalWorkers(pack.workers);
        setPage("LocalMap");
    }

    function onSave() {
        // Saves the entire game state to the server
        // Normally we wouldn't provide a save button, but have the game save regularly, like every minute. But we need things working first

        // Saving tile data is more complex than the rest of the data. First, we need to create a deep copy of the tile array
        let sendTiles = game.tiles
            .filter((t) => t.modified)
            .map((t) => {
                let u = { ...t };
                delete u.modified;
                delete u.image;
                u.items = u.items.map((i) => {
                    if (typeof i === "undefined") {
                        console.log(i, u);
                    }
                    if (i.inTask === 0) {
                        return i;
                    }
                    return { ...i, inTask: i.inTask.id };
                });
                return u;
            });
        console.log(sendTiles[0]);
        let timeTracker;

        // Set up a function to handle sending tile data, that we can call later
        function sendMoreTiles() {
            // send another batch of tiles
            let batch = sendTiles.splice(0, 50);
            fetch(
                serverURL + "/routes/savetiles.php",
                DAX.serverMessage(
                    {
                        tiles: batch,
                    },
                    true
                )
            )
                .then((res) => DAX.manageResponseConversion(res))
                .catch((err) => console.log(err))
                .then((data) => {
                    if (data.result !== "success") {
                        console.log(data);
                        return;
                    }
                    let progress = new Date();
                    console.log(progress - timeTracker);
                    if (sendTiles.length === 0) {
                        console.log("All done!");
                        return;
                    }
                    sendMoreTiles();
                });
        }

        console.log("Last task id=" + game.lastTaskId);

        fetch(
            serverURL + "/routes/save.php",
            DAX.serverMessage(
                {
                    workers: game.workers.map((w) => ({
                        ...w,
                        tasks: w.tasks.map((t) => t.id), // convert the tasks to only an id. It's still an array
                        carrying: w.carrying.map((i) => {
                            // carried items might also have an associated task, that must be converted to an id too
                            if (i.inTask === 0) {
                                return i;
                            }
                            return { ...i, inTask: i.inTask.id };
                        }),
                        moveCounter: Math.round(w.moveCounter), // Not sure why but this seems to lose integer precision sometimes
                    })),
                    blocks: game.blockList.map((block) => {
                        return block.onSave();
                    }),
                    tasks: game.tasks.map((t) => {
                        let nt = {
                            id: t.id,
                            building: typeof t.building !== "undefined" ? t.building.id : 0,
                            task: typeof t.task === "string" ? t.task : t.task.name,
                            taskType: t.taskType,
                            worker: t.worker === null ? 0 : t.worker.id,
                            status: t.status,
                            targetx: t.targetx === null ? -1 : t.targetx,
                            targety: t.targety === null ? -1 : t.targety,
                            itemsNeeded: t.itemsNeeded, // this has at least some content, but may be empty. It can be a complex structure,
                            // but we'll have to include the whole thing, in order to restore this task correctly
                            toolsNeeded: t.toolsNeeded.map((r) => {
                                // Tools-needed will need to be sent as an object too. But selected tools will need to be serlialized, in a way
                                if (r.selected === null) return { ...r, selected: "null" };
                                // Find the tile currently holding this specific item, so we can get its x & y coordinates
                                let slot = game.tiles.findIndex((tile) => tile.items.includes(r.selected));
                                if (slot === -1) {
                                    // Hmm, maybe a worker is holding it?
                                    slot = game.workers.findIndex((worker) => worker.carrying.includes(r.selected));
                                    if (slot === -1) {
                                        console.log("Error in saveGame: could not locate tool", r.selected);
                                        return { ...r, selected: "error" };
                                    }
                                    return { ...r, selected: r.selected.name, selectedAt: "worker", selectedWorker: game.workers[slot].id };
                                } else {
                                    return {
                                        ...r,
                                        selected: r.selected.name,
                                        selectedAt: "tile",
                                        selectedx: game.tiles[slot].x,
                                        selectedy: game.tiles[slot].y,
                                    };
                                }
                            }),
                            //taggedItems: [], I think we can actually skipped the tagged items. When items are loaded again (after tasks),
                            //  we can run through all items with tags and add them back to the correct tasks
                            // the next fields are optional
                            ...(typeof t.targetItem !== "undefined" && { targetItem: t.targetItem }),
                            ...(typeof t.carryTox !== "undefined" && { carryTox: t.carryTox }),
                            ...(typeof t.carryToy !== "undefined" && { carryToy: t.carryToy }),
                            ...(typeof t.ticksToComplete !== "undefined" && { ticksToComplete: t.ticksToComplete }),
                            ...(typeof t.progress !== "undefined" && { progress: t.progress }),
                        };
                        return nt;
                    }),
                    unlockeditems: game.unlockedItems,
                },
                true
            )
        )
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log(data);
                    return;
                }
                timeTracker = new Date();
                sendMoreTiles();
            });
    }

    function onLocalTileUpdate(newTilesList) {
        // Updates the localmap tiles list with new tile content
        // newTilesList: array of new tiles to add to the list. These tiles will replace existing ones, that match the X & Y coordinates
        game.tiles = game.tiles.map((ele) => {
            // find any tiles within our input list to replace this tile with
            let match = newTilesList.find((mel) => {
                return ele.x === mel.x && ele.y === mel.y;
            });
            if (match === undefined) return ele;
            return match;
        });
        setLocalTiles(game.tiles);
    }

    function pickPage() {
        switch (page) {
            case "HomePage":
                return <HomePage onLogin={onLogin} />;
            case "LocalMap":
                return (
                    <LocalMap
                        stats={localStats}
                        localTiles={localTiles}
                        localWorkers={localWorkers}
                        mobileMode={mobileMode}
                        onTileUpdate={onLocalTileUpdate}
                        onSave={onSave}
                    />
                );
            default:
                return <>Error: Page type {page} has not been handled yet</>;
        }
    }

    return (
        <div className="app">
            <div style={{ backgroundImage: "url(" + imageURL + "banner.png)", backgroundRepeat: "repeat-x" }}>
                <div id="titleblock">
                    <AccountBox onLogin={onLogin} user={userData} errorText={loginError} setErrorText={setLoginError} />
                    <div id="titletext">
                        Settlers & <br />
                        Warlords
                    </div>
                </div>
            </div>
            {pickPage()}
        </div>
    );
}

function HomePage(props) {
    return (
        <>
            <p>
                Settlers and Warlords is an online multiplayer game mixing Idle game concepts with Civilization-style strategy. Start from
                natural land with a few workers.
            </p>
            <img src={imageURL + "homepage_basicland.png"} alt="basic land" />
            <p>Harness your lands to develop technology, unlocking new resources and abilities</p>
            <img src={imageURL + "homepage_gameshot.png"} alt="local map working" />
            <p>Explore the world, discovering exotic structures, creatures and civilizations. Some helpful, others dangerous</p>
            <img src={imageURL + "homepage_worldmap.png"} alt="world map" />
            <p>
                Trade with neighboring players to access greater abilities. Or wage war to conquer their lands. The more land you control,
                the more neighbors you must manage.
            </p>
            <img src={imageURL + "homepage_neighbors.png"} alt="neighbor negotiations" />
            <p>Develop your land to dominate the world</p>
            <RegisterForm onLogin={props.onLogin} />
            <p style={{ fontWeight: "bold" }}>Development Blog</p>
            <ShowBlog serverURL={serverURL + "routes/getblog.php"} />
            {/*
            <p>
                This version of the game (seven) seems to be coming along alright, but hasn't escaped some changes along the way. A few
                weeks ago I got back into playing Dwarf Fortress (by the way there's a new Steam version out, with full graphics and proper
                controls), and have realized how much my game borrows concepts from it, but not fully. Dwarf Fortress lets you assign work,
                but leaves it to your dwarves to decide who does it, and when. I started to realize that players probably won't care which
                worker completes a given task, just as long as it gets done. Having already completed the code that assigns work to workers,
                this means I need to rewrite things... but not everything. I rewrote everything related to workers completing assignments,
                and it's been a success, so far.
            </p>
            <p>
                Now I'm onto bigger challenges - this one I didn't expect. This being a web game, I'll need to periodically save the state
                of the game back to the server. It's simple enough, except for one problem: the local map is 41x41 tiles large (1681 in
                total), and they all have data to send back. Even for a freshly started game, it took over 2 minutes! Not ideal for a
                multi-user game, when this is saving content for only 1 person. But I have solutions in mind, and I want to future-proof
                this, for when later game states get crazy.
            </p>
            <ol>
                <li>
                    Send map data to the server one chunk at a time. This will spread the work on the server over a larger time frame. I can
                    create a complete copy of the existing tiles on the client side, dropping chunks as I send them
                </li>
                <li>
                    Send only tiles that get modified. This will probably have the most significant impact on the amount of data needed to
                    send. But, in planning for late-game, this may have diminishing effects.
                </li>
                <li>
                    Change the way I update the tiles. Databases allow you to insert new data, or in the same statement, update data instead
                    if it finds a matching record ID. The advantage of this method (besides preventing duplicate data) is you can send data
                    about a lot of records all in one statement. My last method required sending one tile to the database at a time, waiting
                    for a response before sending another. So this may have an even larger impact on the time it takes to save.
                </li>
            </ol>
            <p>I think all these changes will make everything work, now and in future challenges. I just need to get it built</p>

Humans are not ready to encounter aliens.
I've been reading a book called The City Stained Red. Is it fiction?
In the book there's several other races of creatures; Schicts, the Tauru, Dragonmen, and many others. All much more capable in combat than
humans. But humans came into this area, forced out all other species, and built a massive city that capitalizes on the silk made by giant
spiders. The other humanoid species are left fighting over scraps, being at the mercy of the humans and their schemes.
Sure, the book is fiction, but when hasn't humanity done this in the past? If humankind were to encounter aliens today, it would go one of
two ways: either they would decimate us, or we would deal and scheme and weasel our way to the point where the aliens would be at our mercy.
Humans have always been this way. We are not ready.

            */}
            <div style={{ textAlign: "center" }}>
                <p className="singleline">Feel free to check out my other projects:</p>
                <p className="singleline">
                    <a href="http://bookalong.x10host.com">BookAlong</a>, a site for book readers
                </p>
                <p className="singleline">
                    <a href="https://danidle.netlify.com">DanIdle</a>, an idle game climbing a tech tree
                </p>
                <p className="singleline">
                    <a href="http://bookalong.x10host.com/matrix">Matrix</a> - it's 3D Minesweeper!
                </p>
            </div>
        </>
    );
}

export default App;
