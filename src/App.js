import React from "react";
import "./App.css";

// Libraries of mine to help do things more easily
import { DAX } from "./DanAjax.js";

// Project-specific components
import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { localMap_fillFromServerData, LocalMap } from "./comp_localMap.jsx";
import { worldMap_fillFromServerData, WorldMap } from "./comp_worldMap.jsx";
import { AdminPage } from "./comp_admin.jsx";
import { game } from "./game.jsx";

/*  Version 7? Yes... Why?
    Version 6 had a lot more control over the production of resources. But I realized that, eventually, managing resources and
    creating new production setups was becoming too tedious. If things are tedious already, they're only going to get worse
    later, with more items that need to be produced, just to keep the colony functioning.
    So I want to use a new approach on managing tasks and resource production; we will be focused more on workers and the tasks
    that they are doing. I think the gameplay should flow like this:
    1) Player place a building down. Colonists can only use buildings that the user has placed in the world; this will limit what
        tasks the colonists can complete.
    2) Buildings will have a set list of tasks that can be done in them. For example, the Flint Tool Maker will allow spears to
        be made. Tasks requiring other resources can be subdivided into multiple steps. So to produce a Flint Spear, the worker
        will need to collect a stick, twine, knapp a flint spear head, and then combine all those at the Flint Tool Maker
    3) The player will select a task to complete, then a worker to complete that task. Idle workers will be listed first, followed
        by busy workers. Changing the priority of a given job can be done by dragging each worker up or down on the list of workers.
    4) If the worker already has a task assigned, the player can select to drop the old task, or add it to the list of tasks the
        worker needs to complete. All tasks assigned to one worker will be completed in a round-robin fashion.
    5) Any workers that don't have an assigned task will opt to assist other workers who have tasks. So when the player places down
        their first Lean-To, all the other workers will assist the worker assigned to it (until another task is assigned).
    6) When selecting a task, players can assign multiple workers to the same task, and they will work together to complete the
        task assigned. If those other workers already had a task, they won't be able to be assigned until their current work is cleared

    We're using https://parser.name/api/generate-random-name/ to generate ranomized names

    Task list
    1) Create some workers. Generate them on the server side (for later tracking) with a name. Pass this data to the client so it can
        be utilized. New players will still start with 4 workers
    2) Write a privacy agreement. Keep it simple, and as a popup. Just say we may contact you in the future about updates with this game,
        and email addresses won't be released

    Further ideas
            Tool boxes: they will provide tools to any blocks needing them within an X-block radius (we can make it 10, for now).
        Any blocks needing a specific tool can get tools from that box. If a block is out of range of a toolbox, the user will be told that
        there are no tools within range. Each toolbox block can only hold a single tool type
        Farmer's post will work in a similar fashion: Any farmable blocks in its range needing work will get work from this block 
            Dragon's Tower: Really an open oil well, spouting oil regularly and actively burning. Travellers discovering this assume it's something
        built & powered by fire-breathing dragons. Later-tech players will be able to put out the fire (with explosives!), cap the oil spout and
        begin pumping oil out of it

    Exotic fantasy creatures https://imgur.com/gallery/3pA5gj5
    Tarred rope machine: https://imgur.com/gallery/emRfXTx
    Traditional Hemp Rope process: https://imgur.com/gallery/73IqiK8
    Various Windmill designs https://imgur.com/gallery/tOUYe2E

    Project size
<<<<<<< HEAD
    src/app.js                            src/block_rockknapper.jsx                  src/block_strawdryer.jsx               src/blockRunsFire.jsx                   server/mapbuilder.php
        src/app.css                           src/block_toolbox.jsx                      src/block_farmerspost.jsx              src/blockSharesOutputs.jsx              server/usermap.php
            src/DanAjax.js                        src/block_stickmaker.jsx                   src/block_loggerspost.jsx             src/comp_worldMap.jsx                    server/process.php
               src/comp_account.jsx                   src/block_twinemaker.jsx                   src/block_recycler.jsx                src/comp_admin.jsx                       server/event.php
                   src/DanInput.jsx                       src/block_flinttoolmaker.jsx              src/blockDeletesWithItems.jsx          ajax.php                                 server/route_account.php
                      src/DanCommon.js                        src/block_huntingpost.jsx                src/blockHasMultipleOutputs.jsx         server/config.php                        server/route_admin.php
                         src/comp_ErrorOverlay.jsx                src/block_butchershop.jsx               src/blockHasOutputsPerInput.jsx        server/common.php                          server/route_localMap.php
                            src/comp_localMap.jsx                     src/block_firewoodmaker.jsx            src/blockHasSelectableCrafting.jsx      server/DanGlobal.php                       server/route_worldMap.php
                                src/game.jsx                             src/block_campfire.jsx                  src/blockHasWorkerPriority.jsx         server/jsarray.php
                                    src/block_leanto.jsx                     src/block_hauler.jsx                   src/blockMovesWorkers.jsx               server/weightedRandom.php
                                       src/block_foragepost.jsx                  src/block_harvester.jsx                src/blockRequiresTools.jsx              server/globals.php
    489+126+48+208+65+56+68+271+230+88+90+119+222+139+114+152+123+211+85+167+236+192+140+267+132+91+62+58+59+176+58+232+153+178+47+521+428+128+8+285+37+221+126+239+407+434+388+354+284+198+395+214=9819 lines
=======
    src/app.js                            src/block_rockknapper.jsx                  src/block_strawdryer.jsx               src/blockSharesOutputs.jsx              server/usermap.php
        src/app.css                           src/block_toolbox.jsx                      src/block_farmerspost.jsx             src/comp_worlMap.jsx                     server/process.php
            src/DanAjax.js                        src/block_stickmaker.jsx                   src/block_recycler.jsx                src/comp_admin.jsx                       server/event.php
               src/comp_account.jsx                   src/block_twinemaker.jsx                  src/blockDeletesWithItems.jsx          ajax.php                                 server/route_account.php
                   src/DanInput.jsx                       src/block_flinttoolmaker.jsx             src/blockHasMultipleOutputs.jsx         server/config.php                        server/route_admin.php
                      src/DanCommon.js                        src/block_huntingpost.jsx               src/blockHasOutputsPerInput.jsx        server/common.php                          server/route_localMap.php
                         src/comp_ErrorOverlay.jsx                src/block_butchershop.jsx              src/blockHasSelectableCrafting.jsx      server/DanGlobal.php                       server/route_worldMap.php
                            src/comp_localMap.jsx                     src/block_firewoodmaker.jsx            src/blockHasWorkerPriority.jsx         server/jsarray.php
                                src/game.jsx                             src/block_campfire.jsx                 src/blockMovesWorkers.jsx               server/weightedRandom.php
                                    src/block_leanto.jsx                     src/block_hauler.jsx                   src/blockRequiresTools.jsx              server/globals.php
                                       src/block_foragepost.jsx                  src/block_harvester.jsx                src/blockRunsFire.jsx                   server/mapbuilder.php
    489+126+48+208+65+56+68+271+228+88+90+119+222+139+114+144+123+211+85+167+236+192+140+267+91+62+58+59+176+58+232+153+178+47+521+428+128+8+285+37+221+126+239+407+434+388+354+284+198+383+214=9665 lines
>>>>>>> 569c683095e7fa94284ec17b01dbef7272b316fe
    3/13/2021 = 5588 lines
    3/27/2021 = 6448 lines
    4/3/2021  = 6985 lines
    4/11/2021 = 7885 lines
    4/17/2021 = 8328 lines
    4/24/2021 = 8663 lines
    5/1/2021  = 8759 lines
    5/8/2021  = 9488 lines
<<<<<<< HEAD
    5/29/2021 = 9819 lines
=======
    5/15/2021 = 9665 lines
>>>>>>> 569c683095e7fa94284ec17b01dbef7272b316fe
*/

//* Since the app is officially published when using npm run build, this leaves us trying to connect to the public server
export const serverURL = process.env.NODE_ENV === "production" ? "ajax.php" : "http://localhost:80/settlerswarlords/ajax.php";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

function App() {
    const [userData, setUserData] = React.useState(null);
    const [page, setPage] = React.useState("home");
    const [localTiles, setLocalTiles] = React.useState(null); // Holds all the map tiles
    const [localStats, setLocalStats] = React.useState(null); // Stores data about this area, but not the map tiles
    const [worldMap, setWorldMap] = React.useState(null);
    const [worldSpecifics, setWorldSpecifics] = React.useState(null);
    // Specific to admins only
    const [adminBuildingList, setAdminBuildingList] = React.useState(null);

    // Try to auto-login the user, if we have localStorage data stored
    React.useEffect(() => {
        if (typeof localStorage.getItem("userid") === "object") return; // Do nothing if no data is in localStorage
        console.log(typeof localStorage.getItem("userid"));

        fetch(serverURL, DAX.serverMessage("autologin", { userid: localStorage.getItem("userid"), access: localStorage.getItem("access") }, false))
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log("Error in auto-login:", data);
                    return;
                }
                onLogin(data);
            });

        // Start the progress loop!
        game.timerLoop = setInterval(game.update, 1000);
    }, []);

    function onLogin(pack) {
        //console.log("Received login message", pack);
        if (pack === null) {
            // Receiving null means the user is trying to log out
            setUserData(null);
            localStorage.removeItem("userid");
            localStorage.removeItem("access");
            setPage("home");
            setLocalTiles(null);
            setLocalStats(null);
            setWorldMap(null); // we need to clear this too, so the new user can load content
        } else {
            setUserData({ id: pack.userid, access: pack.access });
            localStorage.setItem("userid", pack.userid);
            localStorage.setItem("access", pack.access);

            // Handle any admin users here
            if (pack.userType === "admin") {
                setAdminBuildingList(pack.buildings);
                setPage("admin");
                return;
            }

            console.log(pack.localContent);
            console.log(pack.localTiles);
            let mapSet = localMap_fillFromServerData(pack.localTiles);

            // Handle unlocking items. game.checkUnlocks works off the unlockedItems list, not the items that are passed into the function
            if (pack.unlockedItems !== null) {
                game.unlockedItems = pack.unlockedItems;
            }
            game.checkUnlocks("");

            // Now we need to apply the buildings (blocks) to the map
            console.log("Block data:", pack.blocks);
            if (pack.blocks !== null) {
                pack.blocks.forEach((block) => {
                    // Start by getting the map tile this block should be placed at - from the mapSet
                    let tile = mapSet.findIndex((e) => e.x === block.x && e.y === block.y);
                    mapSet[tile].buildid = parseInt(block.id);

                    // Now, generate a new block, passing in the map data... First find the correct building type in game.blockTypes
                    let buildType = game.blockTypes.find((e) => e.name === block.name);
                    let built = buildType.create(mapSet[tile]);
                    mapSet[tile].buildimage = built.image;
                    built.id = parseInt(block.id); // All blocks need this id set for them; easier to do it here than in each block type
                    built.load(block);
                    game.blocks.push(built);
                });
            } else {
                pack.blocks = [];
            }
            // Even with all blocks built, some blocks are dependent upon others to function, and it is a good possibility that
            // one block won't exist when the other is made. So we need a second loading operation for certain blocks
            game.blocks.forEach((block) => {
                if (typeof block.finishLoad !== "undefined") block.finishLoad();
            });
            game.tiles = mapSet;
            game.foodCounter = parseInt(pack.foodCounter);

            // For all workers, we need to initiate a tasks array (of objects). This will start empty. We will need to expand on this later
            game.workers = pack.workers.map((worker) => {
                if (typeof worker.tasks === "undefined") worker.tasks = [];
                return worker;
            });

            game.items = pack.allItems === null ? [] : pack.allItems;
            game.population = pack.localContent.population;
            game.updateReact = setLocalTiles; // Pass the handle of the function, not its result

            game.isRunning = true;

            setLocalStats(pack.localContent);
            setLocalTiles(mapSet);
            setPage("localmap"); // This needs to be done last, since it actually updates what is displayed
        }
    }

    function onChangePage(newpage) {
        // Handles updating the page that the player is viewing.
        // Not all web content is provided to the user right away (mainly world map data, others may be included later)
        // This handles fetching the data from the server when the page is asked for

        switch (newpage) {
            case "worldmap":
                if (worldMap !== null) {
                    setPage("worldmap");
                    return;
                }
                fetch(serverURL, DAX.serverMessage("getworldmap", {}, true))
                    .then((res) => DAX.manageResponseConversion(res))
                    .catch((err) => console.log(err))
                    .then((data) => {
                        //console.log("World map data: ", data);
                        setWorldMap(worldMap_fillFromServerData(data, userData.id));
                        setWorldSpecifics({ userid: userData.id, curx: data.currentx, cury: data.currenty });
                        setPage("worldmap");
                    });
                break;
            default:
                setPage(newpage); // Everything else just passes to the normal setPage function
        }
    }

    function onTileUpdate(pack) {
        // Handles updating a set of tiles that need updating. Once finished, we will update React with the new data
        //console.log("pack received:", pack);
        //let newSet = localTiles.map((ele) => {
        game.tiles = game.tiles.map((ele) => {
            // Find any tiles within 'pack' to replace our list with
            let match = pack.find((mel) => {
                return ele.x === mel.x && ele.y === mel.y;
            });
            if (match === undefined) return ele;
            return match;
        });

        setLocalTiles(game.tiles);
    }

    // So, instead of passing functions down to the components, where we handle server contact & updating the buildings list here,
    // we can simply pass in the building updater function, and have the individual components handle server comm & calling the updater
    // function
    return (
        <div className="app">
            <div style={{ backgroundImage: "url(" + imageURL + "banner.png)", backgroundRepeat: "repeat-x" }}>
                <div id="titleblock">
                    <AccountBox onLogin={onLogin} user={userData} />
                    <div id="titletext">
                        Settlers & <br />
                        Warlords
                    </div>
                </div>
            </div>
            <PagePicker
                page={page}
                setPage={onChangePage}
                onLogin={onLogin}
                localTiles={localTiles}
                localStats={localStats}
                onTileUpdate={onTileUpdate}
                worldMap={worldMap}
                changeWorldMap={setWorldMap}
                worldSpecifics={worldSpecifics}
                adminBuildingList={adminBuildingList}
                adminChangeBuildings={setAdminBuildingList}
            />
        </div>
    );
}

function PagePicker(props) {
    // A simple component to determine what is displayed as the main content of the page
    // prop fields - data
    //      page - which page to display. This is the only prop used for this component specifically; everything else is passed
    //              to the respective child components
    //      localTiles - list of all map tiles of the local map
    //      localStats - objec tholding stats about the local map
    //      worldMap - full map content of the world map (as the user understands it)
    //      worldSpecifics - needed details for the world map, that is separate from the tiles array
    //      adminBuildingList - List of all buildings, for the admin to be able to edit them. Actions and their items are attached
    // prop fields - functions
    //      onLogin - Handles the data received from the server after a user has logged in
    //      setPage - Updates the page displayed
    //      onTileUpdate - Updates the local map content, triggering a render update
    //      changeWorldMap - React updater function to update the world map list
    //      adminChangeBuildingList - React updater function for the buildings list. For the admin building list only

    switch (props.page) {
        case "home":
            return <HomePage onLogin={props.onLogin} />;
        case "localmap":
            return <LocalMap setPage={props.setPage} localTiles={props.localTiles} localStats={props.localStats} onTileUpdate={props.onTileUpdate} />;
        case "inventory":
            return <InventoryPage setPage={props.setPage} inventory={props.localMap.items} />;
        case "worldmap":
            return (
                <WorldMap
                    setPage={props.setPage}
                    worldMap={props.worldMap}
                    changeWorldMap={props.changeWorldMap}
                    specifics={props.worldSpecifics}
                    localItems={props.localMap.items}
                />
            );
        case "testpage":
            return (
                <div onMouseDown={() => console.log("mouse down!")}>
                    <PageChoices selected={"testpage"} onPagePick={props.setPage} />
                    Hello world
                </div>
            );
        case "admin":
            return <AdminPage buildings={props.adminBuildingList} changeBuildingList={props.adminChangeBuildings} />;
        default:
            return <div>We seem to not yet have content for page {props.page}</div>;
    }
}

export function InventoryPage(props) {
    // Displays inventory stats of the current tile for the user
    // prop fields - data
    // prop fields - functions
    //      setPage - Updates the page displayed

    return (
        <div>
            {/* Show the header bar. Having a component to do this for me is nice */}
            <PageChoices selected={"inventory"} onPagePick={props.setPage} />
            {/* Now for the real work */}
            {props.inventory === null
                ? ""
                : props.inventory.map((item, key) => (
                      <div key={key}>
                          {item.name} x{item.amount}
                      </div>
                  ))}
            {/* Such a simple page right now. I'm sure it'll grow */}
        </div>
    );
}

export function PageChoices(props) {
    // Displays a list of possible pages the user can switch to. This is only shown to users who are logged in. Actual page
    // display is handled by PagePicker, but this provides an interface to allow the user to pick one to show.
    // prop fields - data
    //      selected - which page should be shown as the selected page
    // prop fields - functions
    //      onPagePick - handles changing which page is being displayed

    // We need to declare two possible styles for display: one for the selected page, and one for everything else
    let picked = { margin: 10, fontWeight: "bold" };
    let others = { margin: 10, textDecoration: "underline", cursor: "pointer" };
    // This pulls 2 attributes from the fakelink css class, but that's easier than doing a ternary on whether to include a class or not

    return (
        <span>
            <span style={props.selected === "localmap" ? picked : others} onClick={() => props.onPagePick("localmap")}>
                Local Map
            </span>
            <span style={props.selected === "inventory" ? picked : others} onClick={() => props.onPagePick("inventory")}>
                Inventory
            </span>
            <span style={props.selected === "worldmap" ? picked : others} onClick={() => props.onPagePick("worldmap")}>
                World Map
            </span>
            <span style={props.selected === "testpage" ? picked : others} onClick={() => props.onPagePick("testpage")}>
                TestPage
            </span>
        </span>
    );
}

function HomePage(props) {
    return (
        <div>
            <p>
                Settlers and Warlords is an online multiplayer game mixing Idle game concepts with Civilization-style strategy. Start from natural
                land with a few workers.
            </p>
            <img src={imageURL + "homepage_basicland.png"} />
            <p>Harness your lands to develop technology, unlocking new resources and abilities</p>
            <img src={imageURL + "homepage_gameshot.png"} />
            <p>Explore the world, discovering exotic structures, creatures and civilizations. Some helpful, others dangerous</p>
            <img src={imageURL + "homepage_worldmap.png"} />
            <p>Develop your land to dominate the world</p>
            <RegisterForm onLogin={props.onLogin} />
            <p style={{ fontWeight: "bold" }}>Important Updates</p>
            <p>
                Guess what? We're starting version 7! Maybe I AM a little crazy... but whatever. After spending a lot of time on version 6, I started
                to realize things weren't as fun as I had wanted it to be. It took some time to figure out why: the game was just turning out too
                tedious; too much work for small gains. Producing basic resources was already turning into a lot of steps. There was no simple way to
                produce one of a needed item; you had to create the process, no matter how many you needed to make. If things are this challenging to
                manage at this level, it'll only get more challenging & tedious as the game progresses.
            </p>
            <p>
                My plan is to approach this on a more per-worker level. Players will assign tasks to workers to complete, usually with a fixed number
                of items to create, or keep on hand. Complex items can be included in this too; if a worker needs to produce Flint Spears, that worker
                will craft the individual parts first. Players will be able to assign more than one worker to a task, delegating the work to each one.
                Tasks will still be limited by buildings available, and tech progression limited by items produced... so hopefully it'll work.
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
        </div>
    );
}

export default App;

/*          Functions, components & their locations
    component       AccountBox                      - src/comp_account.jsx
    component       App                             - src/App.js
    Object          blockHasMultipleOutputs         - blockHasMultipleOutputs.jsx
    Object          blockHasOutputsPerInput         - blockHasOutputsPerInput.jsx
    Object          blockHasSelectableCrafting      - blockHasSelectableCrafting.jsx
    Object          blockHasWorkerPriority          - blockHasWorkerPriority.jsx
    Object          blockMovesWorkers               - blockMovesWorkers.jsx
    Object          ButcherShop                     - block_butchershop.jsx
    array of object cardinalDirections              - src/comp_worldMap.jsx
    component       ClickableLabel                  - src/comp_localMap.jsx
    function        DanCommon.flatten               - src/DanCommon.js
    function        DanCommon.getRandomFrom         - src/DanCommon.js
    function DanCommon.hasAny - src/DanCommon.js
    function DanCommon.manhattanDist - src/DanCommon.js
    function DanCommon.multiRelace - src/DanCommon.js
    function DanCommon.removeDuplicates - src/DanCommon.js
    function DanCommon.within - src/DanCommon.js
    component DanInput - src/DanInput.jsx
    function DAX.manageResponseConversion - src/DanAjax.js
    function DAX.sendError - src/DanAjax.js
    function        DAX.serverMessage               - src/DanAjax.js
    component       ErrorOverlay                    - src/comp_ErrorOverlay.jsx
    Object          FirewoodMaker                   - src/block_firewoodmaker.jsx
    Object          FlintToolMaker                  - src/block_flinttoolmaker.jsx
    Object          ForagePost                      - src/block_foragepost.jsx
    Object          game                            - src/game.jsx
    array of object game.blocks                     - src/game.jsx
    array of object game.blockTypes                 - src/game.jsx
    function        game.checkUnlocks               - src/game.jsx
    function        game.createItem                 - src/game.jsx
    Int             game.foodCounter                - src/game.jsx
    function        game.getNeighbors               - src/game.jsx
    function        game.getNextBlockId             - src/game.jsx
    Bool            game.isRunning                  - src/game.jsx
    array of object game.items                      - src/game.jsx
    function        game.sortBlocks                 - src/game.jsx
    (array of object) game.tiles           - src/game.jsx
    object          game.timerLoop                  - src/game.jsx
    function        game.toolCount                  - src/game.jsx
    function        game.toolLocation               - src/game.jsx
    array of object game.travellers                 - src/game.jsx
    array of string game.unlockedItems              - src/game.jsx
    function        game.update                     - src/game.jsx
    function        game.updateReact                - src/game.jsx
    float           game.workPoints                 - src/game.jsx
    component       HomePage                        - src/App.js
    Object          HuntingPost                     - src/block_huntingpost.jsx
    const (string)    imageURL             - src/App.js
    component         InventoryPage        - src/App.js
    object            LeanTo                        - src/block_leanto.jsx
    component         LocalMap                      - src/comp_localMap.jsx
    function          localMap_fillFromServerData() - src/comp_localMap.jsx
    component LocalTileBuildingDetail - src/comp_localMap.jsx
    function manDist (int) - src/comp_worldMap.jsx
    component PageChoices - src/App.js
    component PagePicker - src/App.js
    component       RegisterForm                    - src/comp_account.js
    Object          RockKnapper                     - src/block_rockknapper.jsx
    String          serverURL                       - src/App.js
    Object          StickMaker                      - src/block_stickmaker.jsx
    Object          Toolbox                         - src/block_toolbox.jsx
    Object          TwineMaker                      - src/block_twinemaker.jsx
    component       WorldActionDetail               - src/comp_worldMap.jsx
    component Worldmap - src/comp_worldMap.jsx
    const worldMapTile (array of object) - src/comp_worldMap.jsx
    function worldMap_fillFromServerData (array of object) - src/comp_worldMap.jsx
    component WorldTileDetail - src/comp_worldMap.jsx
*/
