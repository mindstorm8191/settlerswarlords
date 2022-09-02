import React from "react";
import "./App.css";

import { DAX } from "./libs/DanAjax.js"; // A library to make Fetch calls a little easier

import { game } from "./game.jsx";
import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { LocalMap } from "./comp_LocalMap.jsx";

/* Task List
1) Allow production of items to be cancelled
2) Show busy workers correctly, and provide ways to change a task of a given worker, so work can be queued.
3) Have the Forage Post show all foods at its location
4) Get back to finishing the Rock Knapper. Start working on new buildings
5) Add cotton to the game, in some way. Cotton cannot be harvested until leather gloves and other clothes are available.

Things to add later
1) Add bush types to localmap worldgen: blueberry, grape, Firethorn, Buckthorn, Agarita, Gooseberry
2) Have workers follow A* pathfinding for fastest route.
3) Modify tree & bush placements to consider non-crossable paths due to thorns or overgrowth. Players will be able to clear these to make worker
    travel easier.

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

Project size (because it's fun to watch this grow)
src/App.js                         src/libs/DanInput.jsx            server/mapContent.php          worldgen.md
    src/libs/DanAjax.js               src/comp_ErrorOverlay.jsx         server/routes/autologin.php   workercrafting.md
       src/game.jsx                      server/common.php                 server/routes/login.php
           src/comp_LocalMap.jsx             server/jsarray.php               server/routes/logout.php
               src/libs/DraggableMap             server/config.php               server/routes/reporterror.php
                   src/libs/DanCommon.js           server/DanGlobal.php             server/routes/signup.php
                      src/structures/LeanTo.jsx       server/finishLogin.php            README.md
                         src/stuctures/ForagePost.jsx    server/globals.php                techtree.md
                            src/structures/RockKnapper.jsx   server/weightedRandom.php        automationtree.md
                               src/comp_account.jsx              server/getInput.php             wartree.md
243+49+322+372+141+74+98+83+95+228+65+68+285+221+8+37+38+318+126+33+391+36+43+30+25+216+38+37+12+8+53+11
8/31/2022 = 3804 lines
*/

// Accessing the server will work differently between if this project is in dev mode or in production mode.
// In Dev mode, since Create-React-App is running as a separate entity from the server, we will have to request
// content through a full URL (and work around CORS). Once the site is published, all this will be 'local' to the app
export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

/* *** Building project ***
   To build this project, run 'npm run build' from the command line.
   Note that you will need to change the homepage variable within package.json
*/

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [userData, setUserData] = React.useState(null);
    const [localTiles, setLocalTiles] = React.useState(null);
    const [localWorkers, setLocalWorkers] = React.useState(null);
    const [loginError, setLoginError] = React.useState("");

    // Mobile display variables. If the page is already under 900 pixels wide, enable Mobile Mode
    const [mobileMode, setMobileMode] = React.useState(window.innerWidth > 900 ? false : true);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 900) {
                setMobileMode(false);
                //setMobileLeftPane(false);
            } else {
                setMobileMode(true);
            }
            console.log("win-width " + window.innerWidth + ", " + mobileMode);
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
        pack.workers = game.prepWorkers(pack.workers);

        // Use localStorage to keep the user's ID & access code
        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

        game.setupGame(pack.localTiles, pack.workers, setLocalTiles, setLocalWorkers);
        game.startGame();

        setUserData({ id: pack.userid, ajax: pack.ajaxcode });
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
                Guess what? We're starting version 7! Maybe I AM a little crazy... but nevermind that. After spending a lot of time on
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
