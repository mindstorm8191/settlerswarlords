import React from "react";
import "./App.css";

import { DAX } from "./libs/DanAjax.js"; // A library to make Fetch calls a little easier

import { game } from "./game.jsx";

import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { LocalMap } from "./comp_LocalMap.jsx";

/* Task List
1) Allow wooden log chunks to be cut, then wooden bowls
3) Provide an X button when assigning tasks, to clear the current task being created
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
src/App.js                               src/structures/RockKnapper.jsx       server/globals.php                   automationtree.md
    src/App.css                              src/structures/LoggersPost.jsx       server/weightedRandom.php           wartree.md
        src/libs/DanAjax.js                      src/structures/RopeMaker.jsx         server/getInput.php               worldgen.md
           src/game.jsx                             src/structures/DirtSource.jsx        server/mapContent.php             workercrafting.md
               src/workers.jsx                          src/comp_account.jsx                  server/routes/autologin.php
                   src/comp_LocalMap.jsx                    src/libs/ErrorOverlay.jsx            server/routes/login.php
                       src/libs/DraggableMap.jsx               server/common.php                    server/routes/logout.php
                           src/libs/DanCommon.js                   server/jsarray.php                  server/routes/reporterror.php
                              src/libs/DanInput.jsx                    server/config.php                  server/signup.php
                                 src/stuctures/LeanTo.jsx                server/DanGlobal.php                 README.md
                                     src/structures/ForagePost.jsx          server/finishLogin.php               techtree.md
279+127+49+295+550+454+172+74+65+163+123+250+242+90+106+228+68+285+221+8+37+38+319+126+33+448+36+43+30+25+224+38+27+12+8+53+11
8/31/2022 = 3804 lines
9/5/2022 = 4365 lines
9/14/2022 = 4629 lines
10/5/2022 = 5158 lines
10/22/2022 = 5357 lines
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

        game.setupGame(pack.localTiles, pack.workers, setLocalTiles, setLocalWorkers);
        game.startGame();

        setUserData({ id: pack.userid, ajax: pack.ajaxcode });
        setLocalStats(pack.localContent);
        setLocalTiles(pack.localTiles);
        setLocalWorkers(pack.workers);
        setPage("LocalMap");
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
                        onTileUpdate={onLocalTileUpdate}
                        mobileMode={mobileMode}
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
            <p style={{ fontWeight: "bold" }}>Important Updates</p>
            <p>
                Guess what? We're starting version 7! Maybe I AM a little crazy... but it doesn't matter. After spending a lot of time on
                version 6, I started to realize things weren't as fun as I had wanted it to be. I wanted resource production to be tetious,
                but this was TOO tedious. This time, work will be centered around a per-worker level. Workers are assigned tasks (or a
                series of tasks) and they determine how to accomplish that. This may feel a lot more like Dwarf Fortress, but I don't mind.
            </p>
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
