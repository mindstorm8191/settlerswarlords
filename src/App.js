import React from "react";
import "./App.css";

// Libraries of mine to help do things more easily
import { DAX } from "./DanAjax.js";

// Project-specific components
import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { LocalMap } from "./comp_localMap.jsx";
//import { worldMap_fillFromServerData, WorldMap } from "./comp_worldMap.jsx";
//import { AdminPage } from "./comp_admin.jsx";
import { game } from "./game.js";

/*  Version 7? Yes! ...Why?
    Version 6 had a lot more control over the production of resources. But I realized that, eventually, managing resources and
    creating new production setups was becoming too tedious. If things are tedious already, they're only going to get worse, as
    more production lines were created, just to keep a basic colony functioning.
    This time, we're going to focus more on workers and their tasks, instead of buildings. Buildings will still be the deciding
    factor in what actions can be completed, but workers will decide what must be done, and when. The process should go like this
    1) Player places a building down. This opens up multiple tasks that can be completed.
    2) Player picks a task to complete, then a worker to do that task... and leave them to complete it.
        a) If other workers don't have a task to complete, they will auto-assign themselves as helpers to another worker's task.
            We'll try to keep a balanced number of free workers to each task
        b) If a worker cannot complete a task because they need more basic resources, they will go ahead and create those
            resources first. Many of these can be delegated to helper workers
    3) Players can assign a worker to complete multiple tasks (in round robin fashion), or multiple workers to complete the same
        task
    This will start to appear much more like Dwarf Fortress... but that's okay! It'll also mean workers need to be given names...
    that could be difficult.

    Textiles paved the way into early computer memory, using punch cards https://imgur.com/gallery/8DwbcBG

    Task list
    2) Display buildable building types, and allow players to place buildings
    2) Add the game loop. Get the workers to start moving around
    2) Write a privacy agreement. Keep it simple, and as a popup. Just say we may contact you in the future about updates with this game,
        and email addresses won't be released
    
    Things the need to be done later
    1) Include stats for the rest of the world biome types
    
    Further ideas
        Tool boxes: they will provide tools to any blocks needing them within an X-block radius (we can make it 10, for now).
            Any blocks needing a specific tool can get tools from that box. If a block is out of range of a toolbox, the user will be told that
            there are no tools within range. Each toolbox block can only hold a single tool type. The farmer's post will work in a similar
            fashion: Any farmable blocks in its range needing work will get work from this block 
        Dragon's Tower: A naturally occurring phenomenon. Really an open oil well, spouting oil regularly and actively burning. Travellers
            discovering this assume it's something built & powered by fire-breathing dragons. Later-tech players will be able to put out the
            fire (with explosives!), cap the oil spout and begin pumping oil out of it

    Exotic fantasy creatures https://imgur.com/gallery/3pA5gj5
    Tarred rope machine: https://imgur.com/gallery/emRfXTx
    Traditional Hemp Rope process: https://imgur.com/gallery/73IqiK8
    Various Windmill designs https://imgur.com/gallery/tOUYe2E

    Project size
    3/13/2021 = 5588 lines
    3/27/2021 = 6448 lines
    4/3/2021  = 6985 lines
    4/11/2021 = 7885 lines
    4/17/2021 = 8328 lines
    4/24/2021 = 8663 lines
    5/1/2021  = 8759 lines
    5/8/2021  = 9488 lines
    5/29/2021 = 9819 lines
*/

// Accessing the server will work differently between when this project is in dev mode or production mode.
// In Dev mode, since Create-React-App is running its own server, we need to access the server side (and images) via
//* Since the app is officially published when using npm run build, this leaves us trying to connect to the public server
export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [userData, setUserData] = React.useState(null);
    const [localTiles, setLocalTiles] = React.useState(null);
    const [localWorkers, setLocalWorkers] = React.useState(null);
    const [loginError, setLoginError] = React.useState("");

    // Allow players to log in automatically
    React.useEffect(() => {
        if (typeof localStorage.getItem("userid") === "object") return; // Do nothing if no data is in localStorage
        fetch(
            serverURL + "/routes/autologin.php",
            DAX.serverMessage({ userid: localStorage.getItem("userid"), access: localStorage.getItem("ajaxcode") }, false)
        )
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                // Before proceeding, check that the login was accepted
                if (data.result !== "success") {
                    // Show the error state to the user
                    setLoginError(data.message);
                    return;
                }

                // At this point, everything needs to behandled by the onLogin script
                onLogin(data);
            });
    }, []);

    function onLogin(pack) {
        // Let's see if we can convert all the items from JSON to an array here
        console.log(pack);
        // Before we can get serious about running the game, we need to process some of the data received from the server
        pack.localTiles = pack.localTiles.map((ele) => {
            ele.items = JSON.parse(ele.items);
            return ele;
        });
        let lastWorkerId = 1;
        pack.workers = pack.workers.map((ele) => {
            ele.currentTask = "";
            ele.id = lastWorkerId;
            lastWorkerId++;
            return ele;
        });

        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

        game.tiles = pack.localTiles;
        game.timerLoop = setInterval(game.update, 1000);
        game.workers = pack.workers;
        game.updateWorkers = setLocalWorkers;
        game.updateLocalMap = setLocalTiles;

        setUserData({ id: pack.userid, ajax: pack.access });
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
                return <LocalMap localTiles={localTiles} localWorkers={localWorkers} onTileUpdate={onLocalTileUpdate} />;
            default:
                return <>Error: Page type {page} has not been handled yet</>;
        }
    }

    return (
        <div className="app">
            <div style={{ backgroundImage: "url(" + imageURL + "banner.png)", backgroundRepeat: "repeat-x" }}>
                <div id="titleblock">
                    <AccountBox onLogin={onLogin} user={userData} errorText={loginError} />
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
                Settlers and Warlords is an online multiplayer game mixing Idle game concepts with Civilization-style strategy. Start from natural
                land with a few workers.
            </p>
            <img src={imageURL + "homepage_basicland.png"} alt="basic land" />
            <p>Harness your lands to develop technology, unlocking new resources and abilities</p>
            <img src={imageURL + "homepage_gameshot.png"} alt="local map working" />
            <p>Explore the world, discovering exotic structures, creatures and civilizations. Some helpful, others dangerous</p>
            <img src={imageURL + "homepage_worldmap.png"} alt="world map" />
            <p>
                Trade with neighboring players to access greater abilities. Or wage war to conquer their lands. The more land you control, the more
                neighbors you must manage.
            </p>
            <p>Develop your land to dominate the world</p>
            <RegisterForm onLogin={props.onLogin} />
            <p style={{ fontWeight: "bold" }}>Important Updates</p>
            <p>
                Guess what? We're starting version 7! Maybe I AM a little crazy... but nevermind that. After spending a lot of time on version 6, I
                started to realize things weren't as fun as I had wanted it to be. I wanted resource production to be tetious, but this was TOO
                tedious. This time, work will be centered around a per-worker level. Workers are assigned tasks (or a series of tasks) and they
                determine how to accomplish that. This may feel a lot more like Dwarf Fortress, but I don't mind.
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

/*  Functions and where to find them
function         advanceStartPos    - server/mapContent.php
function         ajaxreject        - server/common.php
component App               - src/App.js
server route      autoLogin            - server/routes/autologin.php
array of objects  biomeData          - server/globals.php
array of objects civTypes           - server/globals.php
function  createWorkers             - server/mapContent.php
function  DanDBList         - server/common.php
function  danescape         - server/common.php
function          DanMultiDB        - server/common.php
array of objects  directionMap       - server/globals.php
component         EmptyLandDescription - src/localTiles.jsx
function          ensureMinimapXY      - server/mapContent.php
script            finishLogin          - server/finishLogin.php
object            game                 - src/game.js
function          generateClusterMap   - server/mapContent.php
script            getInput             - server/getInput.php
component         HomePage             - src/App.js
string            imageURL             - src/App.js
array of strings  knownMapBiomes     - server/globals.php
Building          LeanTo               - src/blocks/LeanTo.jsx
component         localMap             - src/App.js
component         localMapBuildingDetail - src/comp_localMap.jsx
array of strings  localTileNames     - server/globals.php
server route      login                - server/routes/login.php
array of strings  minimapImages        - src/localTiles.jsx
function          newPlayerLocation  - server/mapContent.php
array of strings  oreTypes           - server/globals.php
function          randomFloat        - server/mapContent.php
component         RegisterForm       - src/comp_account.jsx
function  reporterror       - server/common.php
string            serverURL         - src/App.js
server route      signup               - server/routes/signup.php
function  validFloat        - server/common.php
function         validInt          - server/common.php
function         verifyInput          - server/common.php
function         within               - server/mapContent.php
array of strings workerNames   - server/globals.php
array of strings  worldBiomes   - server/globals.php
function          worker_atLocation      - src/game.js
function          worker_stepToward      - src/game.js
function          worldmap_generate - server/routes/signup.php
function  worldmap_updateKnown - server/mapContent.php
*/
