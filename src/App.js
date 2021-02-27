import React from "react";
import "./App.css";

// Libraries of mine to help do things more easily
import { DAX } from "./DanAjax.js";

// Project-specific components
import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { localMap_fillFromServerData, LocalMap } from "./comp_localMap.jsx";
import { worldMap_fillFromServerData, WorldMap } from "./comp_worldMap.jsx";
import { AdminPage } from "./comp_admin.jsx";

/*  Version 5!
    Version 4 was mostly a success. However, we got held up when trying to update population based on food supply
    For this version, we are approaching items in a much different way: they will all be tied to the map record,
    in a single text field (as JSON). When gathering map data, I will have the entire map-tile's items in one field,
    ready to be manipulated as needed.
    There are two reasons we are creating a new version for this task:
    1) the changes needed to support such a system are large and far-reaching. It will be easier & safer to rebuild the whole project from scratch.
    2) I haven't looked at the old code in several months, I cannot say for certain where all the important parts are. Rebuilding gives me an
        opportunity to review the code as I go. I mean, we're not rewriting _everything_ from scratch. I more copy & paste code I know will work
        correctly, and rewrite code bit by bit as I go through rebuilding. It can go pretty fast, at times.

    Task list
    3) Give players the option to conquer the lands neighboring their kingdom
    3) Set up an auto-update system for the client code, that will automatically request updates from the server at a specific time. This can
        be used for world map activities, as well as updating resource production rates after a ResourceUpdate event should have passed. We
        will have to determine how know what to return to the client, but we will likely be able to know that before the request
    3) Add additional details to the knownMap records. We want to be able to determine how much activity the player has had with a given
       land location, and the status of their negotiations, user-made notes, etc
    2) Get units to plot a path to the target whenever they travel somewhere. When they return, they will provide updates to the lands
       they travelled through as well (which will be a bit more up-to-date than their target, since it was furthest away)
    1) Get the user to be able to send a convoy to take over a new land
    1) Work on dropping the fortification field in the building type table. Fortification level will be independent of the development
        process now
    1) Figure out what is causing the isFood parameter to be added to items within the processes structure
    2) Check the other process-related server operations and ensure that resourceTime is being updated, where needed

    4) Start working on remote troop management. Get troops to go to new locations. Set up regular report messenging. Have work done on remote
        lands. Reinforce one group with another
    later: See if having specific groups of tools will be useful. Gregtech has 9, maybe we could match that (or get close to it).
        We will need a way to consume tools as a group, instead of naming specific ones to consume. For example, we want to chop down wood
        using an axe (or hatchet), but we will have many kinds of tools. This will be a separate 'consumption stream' of sorts; we may choose
        to consume weaker tools first (when possible) or the best tools first, not sure yet
    later: Add a method to add a new building to the game. Start it with a name, and have a way to set the building's image
    later: Allow players to set production rate when starting a process. It might just be better to get the page updated when the process starts
    later: Show more details about item production to the user. Show current production vs total production rates
    later: When looking at processes to load, show the resource quantities on hand, along with production & consumption of that resource
    later: When viewing buildings, display the current process running there (from the map content)
    later: Have the server report to the client about any newly created events, when the server responds to a message. This will be useful
        when building upgrades require construction
    later: Move all the ore selection into the WeightedRandom class, to better control the likelihood of each ore
    later: If an action is currently working in a building, don't list it in the 'other processes' section
    later: Include dragons as a civilization in world gen; this will be their place to land.
    later: Provide non-realistic plants of various types, for specific uses. For example, dragon flower plants can be traded with dragons
        (it gives them extra firepower)
    bugs: Panning doesn't work on the actual tiles of the world map. It should, but only works correctly on the open space
  
    Exotic fantasy creatures
    https://imgur.com/gallery/3pA5gj5

    Project size
    src/app.js                 src/comp_worldMap.jsx          server/mapbuilder.php
        src/app.css                src/comp_admin.jsx             server/usermap.php
           src/DanAjax.js              ajax.php                       server/process.php
              src/comp_account.jsx         server/common.php              server/event.php
                  src/DanInput.jsx             server/DanGlobal.php           server/route_account.php
                     src/DanCommon.js             server/jsarray.php              server/route_admin.php
                        src/comp_ErrorOverlay.jsx     server/weightedRandom.php       server/route_localMap.php
                           src/comp_localMap.jsx          server/globals.php              server/route_worldMap.php
    378+47+48+208+62+56+68+405+487+429+122+239+37+220+138+132+404+302+388+270+268+198+245+153=5304 lines (2/23/21)
*/

//* Since the app is officially published when using npm run build, this leaves us trying to connect to the public server
export const serverURL = process.env.NODE_ENV === "production" ? "ajax.php" : "http://localhost:80/settlerswarlords/ajax.php";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

function App() {
    const [userData, setUserData] = React.useState(null);
    const [page, setPage] = React.useState("home");
    const [localMap, setLocalMap] = React.useState(null);
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
    }, []);

    function onLogin(pack) {
        //console.log("Received login message", pack);
        if (pack === null) {
            // Receiving null means the user is trying to log out
            setUserData(null);
            localStorage.removeItem("userid");
            localStorage.removeItem("access");
            setPage("home");
            setLocalMap(null);
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

            let mapSet = localMap_fillFromServerData(pack.mapcontent);
            console.log(mapSet);
            setLocalMap(mapSet);
            setPage("localmap");
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
        let newSet = localMap.minimap.map((ele) => {
            // Find any tiles within 'pack' to replace our list with
            let match = pack.find((mel) => {
                return ele.x === mel.x && ele.y === mel.y;
            });
            if (match === undefined) return ele;
            return match;
        });
        setLocalMap({ ...localMap, minimap: newSet });
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
                localMap={localMap}
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
    //      localMap - full map content of the local world map tile
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
            return <LocalMap setPage={props.setPage} localMap={props.localMap} onTileUpdate={props.onTileUpdate} />;
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
                Yes, I'm building this game from scratch. Well, not completely from scratch. I use a process of copying over code that works, while
                replacing code that doesn't. This lets me review all the code for this project, refining as I go, until I reach portions that require
                full re-writes.
            </p>
            <p>
                I have chosen a new way to manage items within a map tile; instead of being its own record, all items will be a single field, attached
                to the map record, stored as JSON. While this sacrifices the searchability offered by the database (which I wasn't using for items
                anyway), it makes accessing item data faster & easier - it's already attached to map data that I'm already collecting. Will it work?
                The only way to know is to build it, and find out. But doing so means changing everything related to items, which warrants a full
                re-write.
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
