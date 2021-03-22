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
    this game is to be a conceptual expansion of DanIdle.
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
    1) Figure out how to make the progress bar thicker, so it is more visible
    2) Keep adding buildings and get the basic game running
    3) Add a food consumption process that finds food for the colonists to eat
    4) Update the block ID selection process to consider out-of-order blocks
    5) Set up block operation restrictions based on worker points
    6) Allow blocks to be sorted based on priority. Allow blocks to set their priority
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
    src/app.js                 src/comp_worldMap.jsx           server/mapbuilder.php
        src/app.css                 src/comp_admin.jsx             server/usermap.php
            src/DanAjax.js              ajax.php                       server/process.php
               src/comp_account.jsx         server/common.php              server/event.php
                   src/DanInput.jsx             server/DanGlobal.php           server/route_account.php
                      src/DanCommon.js             server/jsarray.php              server/route_admin.php
                         src/comp_ErrorOverlay.jsx     server/weightedRandom.php       server/route_localMap.php
                            src/comp_localMap.jsx          server/globals.php              server/route_worldMap.php
    384+114+48+208+65+56+68+405+521+428+124+239+37+220+138+132+404+434+388+354+268+198+141+214=5588 lines (3/13/2021)
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

            //let mapSet = localMap_fillFromServerData(pack.mapcontent);
            console.log(pack.localTiles);
            let mapSet = localMap_fillFromServerData(pack.localTiles);
            setLocalStats(pack.localContent);
            setLocalTiles(mapSet);
            game.tiles = mapSet;
            game.population = pack.localContent.population;
            game.updateReact = setLocalTiles; // Pass the handle of the function, not its result
            setPage("localmap");
            game.isRunning = true;
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
    component AccountBox - src/comp_account.jsx
    component App - src/App.js
    const cardinalDirections (array of object) - src/comp_worldMap.jsx
    function DanCommon.flatten - src/DanCommon.js
    function DanCommon.getRandomFrom - src/DanCommon.js
    function DanCommon.hasAny - src/DanCommon.js
    function DanCommon.manhattanDist - src/DanCommon.js
    function DanCommon.multiRelace - src/DanCommon.js
    function DanCommon.removeDuplicates - src/DanCommon.js
    function DanCommon.within - src/DanCommon.js
    component DanInput - src/DanInput.jsx
    function DAX.manageResponseConversion - src/DanAjax.js
    function DAX.sendError - src/DanAjax.js
    function DAX.serverMessage - src/DanAjax.js
    component EmptyLandShowBuildChoices - src/comp_localMap.jsx
    component HomePage - src/App.js
    const imageURL (string) - src/App.js
    component InventoryPage - src/App.js
    component LocalMap - src/comp_localMap.jsx
    function localMap_fillFromServerData() - src/comp_localMap.jsx
    component LocalTileBuildingDetail - src/comp_localMap.jsx
    function manDist (int) - src/comp_worldMap.jsx
    component PageChoices - src/App.js
    component PagePicker - src/App.js
    component RegisterForm - src/comp_account.js
    const serverURL (string) - src/App.js
    component WorldActionDetail - src/comp_worldMap.jsx
    component Worldmap - src/comp_worldMap.jsx
    const worldMapTile (array of object) - src/comp_worldMap.jsx
    function worldMap_fillFromServerData (array of object) - src/comp_worldMap.jsx
    component WorldTileDetail - src/comp_worldMap.jsx
*/
