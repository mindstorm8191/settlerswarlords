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

/*  Version 6?!?
    Version 5 was a success, on the aspect of managing resources. We had (almost) everything of that working the way we wanted,
    and it was much faster than before. The problem, however, was that the game was becoming very much not like DanIdle, and
    this game is to be a conceptual expansion of DanIdle. For the current trajectory of Settlers & Warlords, producing
    resources was... boring.
    There are challenges to make this game be more like DanIdle. With DanIdle, all the processing takes place on the client side.
    If players are offline for any amount of time, client-side processing won't happen, and to do step-wise processing on the server
    just wouldn't work. But, is client-side processing really that bad? So here's the plan:
    1) The local map will look much, much more like DanIdle. Players will set up processes to produce goods, just like DanIdle.
        Players will also have ways to produce goods to a certain amount, and put priority on producing X amount of certain items
        (this will involve robust display of processes... lots to figure out with that)
    2) When players leave, all production lines will stop. Production will only happen while players are logged in. We may provide
        'bonus ticks' (a concept from Reactor Idle) to allow players to catch up with lost time, though it may not be as valuable
        as being logged in the whole time.
    3) The client will report items on-hand to the server, which will occur on a regular basis. We will also provide a save button
        for when players leave. There may be a way to save as players exit the page, but I won't take that as a guarantee of
        saving the game. This will probably save the game state as well, meaning we'll be sending a lot more data to the server
        this time around
    All these changes mean all of the existing code is now, mostly irrelevant. Hence the new version!

    Task list
    1) Allow the population to grow when there's enough food around (we'll worry about housing limits later)
    2) Adjust the displayed population to show idle workers (coupled with population). This will need to be updated every game tick
    3) Allow blocks to drop items. This will be an option in blockHasMultipleOutputs. This needs to be something that can be toggled,
        and still displayed afterwards
    1) Figure out what needs to be added next.
        Item storage: We will still need this, but is now more flexible since it won't deal with tools
        Hunting post: Will unlock meats for population growth... probably making it easier to test. But this also means making the
            butcher shop, campfire and firewood collector
        Loggers post: Unlocks lots of wood options, this will be a new feature to test (with things that can't be moved by hand)
        Farming: With the sickle we can clear grasslands, then with shovels start plowing lands to plant new crops. Need to modify
            worldgen to include various grain types (while building the clusters)
        Mad dash to metals: We will need the loggers post first, in order to craft wooden bowls
    1) Toolbox: Figure out a proper way for tools to be gathered when the box is empty and there are pending tool requests
    1) Toolbox: Allow certain tasks to be queued up. Also have requesting blocks continuously request tools (when they need one)
    2) Build an AcceptsItemsFromNeighbors add-on component, so that we can streamline the process of receiving items from nearby blocks.
        Something similar that can be built is SharesOutputsWithNeighbors, which might take care of most of our output management functions
        of most blocks
    Later: Complete the other tasks for the toolbox: allowing blocks to pick up tools
    later: Add a solution for when food runs completely out. The population should go down some, and the food counter be reset
    later: Add a status field to all blocks. Use this to show an icon on the top left of each block, to show the status
    later: Add a new block to center the display on a selected block. Provide this for any mobile users. Figure out a way to test this out
    
    Further ideas
    Tool boxes: they will provide tools to any blocks needing them within an X-block radius (we can make it 10, for now).
    Any blocks needing a specific tool can get tools from that box. If a block is out of range of a toolbox, the user will be told that
    there are no tools within range. Each toolbox block can only hold a single tool type
    Farmer's post will work in a similar fashion: Any farmable blocks in its range needing work will get work from this block 
  
    Exotic fantasy creatures
    https://imgur.com/gallery/3pA5gj5
    Project size
    src/app.js                         src/block_foragepost.jsx          src/block_hauler.jsx                src/comp_admin.jsx                     server/event.php
        src/app.css                       src/block_rockknapper.jsx          src/blockHasMultipleOutputs.jsx     ajax.php                               server/route_account.php
            src/DanAjax.js                   src/block_toolbox.jsx              src/blockHasOutputsPerInput.jsx      server/common.php                      server/route_admin.php
               src/comp_account.jsx              src/block_stickmaker.jsx          src/blockHasSelectableCrafting.jsx    server/DanGlobal.php                   server/route_localMap.php
                   src/DanInput.jsx                  src/block_twinemaker.jsx          src/blockHasWorkerPriority.jsx       server/jsarray.php                      server/route_worldMap.php
                      src/DanCommon.js                  src/block_flinttoolmaker.jsx      src/blockMovesWorkers.jsx             server/weightedRandom.php
                         src/comp_ErrorOverlay.jsx         src/block_huntingpost.jsx          src/blockRequiresTools.jsx            server/globals.php
                            src/comp_localMap.jsx             src/block_butchershop.jsx           src/blockRunsFire.jsx                 server/mapbuilder.php
                                src/game.jsx                      src/block_firewoodmaker.jsx         src/blockSharesOutputs.jsx            server/usermap.php
                                    src/block_leanto.jsx             src/block_campfire.jsx              src/comp_worldMap.jsx                  server/process.php
    470+126+48+208+65+56+68+247+184+82+75+77+173+105+82+82+91+139+71+113+101+31+57+164+58+219+130+152+42+521+428+127+239+37+221+127+218+402+434+388+354+297+198+255+214=7885 lines
    3/13/2021 = 5588 lines
    3/27/2021 = 6448 lines
    4/3/2021  = 6985 lines
    4/11/2021 = 7885 lines
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
                game.checkUnlocks("");
            }

            console.log(pack.blocks);
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
                Settlers and Warlords is an online multiplayer game focused on land and tech development. Cultivate your lands to support your
                civilization and its growth. Then use new technologies to improve your lands even further. Acquire greater amounts of land to support
                an increasing population. Negotiate with neighboring colonies to create trade deals, or support each other by fortifying your
                bordering lands against mutual enemies. Outfit your armies with your best tech to wage war and capture enemy lands.
            </p>
            <RegisterForm onLogin={props.onLogin} />
            <p style={{ fontWeight: "bold" }}>Important Updates</p>
            <p>
                Version 6? Starting from scratch, again? Am I crazy? Now, before you freak out, there are good reasons for restarting. Settlers &
                Warlords is supposed to be a conceptual expansion of another project of mine, DanIdle, where players set up production chains to
                produce resources, building their way up a tech tree. (DanIdle had no need to produce weapons or defenses as there was nothing to
                threaten the player, and what's the fun in that?) The previous version of Settlers & Warlords was... kinda nice in it's own right. But
                in comparison to DanIdle, it was missing the mark.
            </p>
            <p>
                This time, we're going to do things much differently. Players will manage resource production client-side, just like DanIdle. No
                production will happen while players aren't playing, but that's okay. We can also throw in a larger-world environment that players
                have to explore, with threats to deal with and other players to encounter. It should be a lot of fun! But now most the old code is
                irrelevant (including all the process management code I spent so much time perfecting), but that's how life goes sometimes.
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
