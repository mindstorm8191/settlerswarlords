/*  Settlers & Warlords
    An MMO slash idle game focused on development instead of all-out war
*/

/*
    Rock Types
    Intrusive Igneous - Comes from lava, cools slowly, originally cooling deep underground
    Extrusive Igneous - Comes from lava, cools rapidly. May form smooth or jagged glass surfaces
    Sedimentary - Produced from sand and dusts smashed together
    Metamorphic - Comes from many rocks that are heated and crushed deep underground

    Copper refining methods
    Froth Flotation (most commonly used)
        Crush ore into fine powder
        Mix with water & chemicals to create a fine slurry
        Blow air into the slurry to create bubbles. The copper attaches to the bubbles and floats to the surface.
        Skim off the top froth and allow to dry
    Electrorefining (purify already-extracted copper)
        Electrolysis; use pure copper on cathode, impure copper on anode. With current, impurities from anode plate onto the cathode
    Bioleaching: bacteria produces acids that dissolve the copper

    Zinc Sulfide: The secret to glow in the dark toys https://www.acs.org/molecule-of-the-week/archive/z/zinc-sulfide.html

    Known bugs (with work-arounds)
    1)  Whenever a task gets completed, if the building with that task is selected, React will still attempt to render that task from
        the task list, despite the fact that it doesn't exist anymore. I have added a check within the loop to check if the task is
        defined or not; it will display 'none' as the task, if so.
*/

// Lines count
// src/app.js                           src/game_tasks.js                     src/LocalMap.jsx                       server/libs/weightedRandom.php        server/routes/worldmap.php      notes/futureprocesses.md
//     src/app.css                          src/worker.jsx                        src/libs/DraggableMap.jsx              server/routes/getblog.php            resetgame.php                   notes/tasklist.md
//        src/libs/DanCarousel.jsx              src/minimapTiles.jsx                  src/WorldMap.jsx                      server/routes/log.php                README.md
//            src/libs/ShowBlog.jsx                src/foodOptions.js                     server/routes/autologin.php          server/routes/login.php              notes/techtree.md
//               src/libs/DanAjax.js                  src/structures/LeanTo.jsx              server/config.php                    server/routes/save.php               notes/automationtree.md
//                  src/libs/DanLog.js                   src/structures/ForagePost.jsx         server/libs/common.php                 server/routes/savetiles.php         notes/wartree.md
//                     src/Account.jsx                      src/structures/RockKnapper.jsx         server/libs/jsarray.php               server/routes/sendunits.php        notes/worldgen.md
//                         src/libs/DanInput.jsx                src/structures/LoggersPost.jsx         server/events.php                    server/routes/signup.php           notes/worldhistory.md
//                            src/libs/DanCommon.js                 src/structures/RopeMaker.jsx           server/getInput.php                  server/libs/DanGlobal.php         notes/magicsystem.md
//                               src/libs/ErrorOverlay.jsx             src/structures/DirtSource.jsx          server/finishLogin.php               server/libs/clustermap.php        notes/undergroundbiomes.md
//                                  src/game.jsx                          src/structures/WaterSource.jsx         server/globals.php                    server/minimap.php               notes/workercrafting.md
// 349+54+120+96+48+38+229+65+83+68+413+138+735+72+60+99+56+165+184+66+95+124+415+190+254+37+8+307+230+233+33+38+299+127+40+36+44+127+77+95+350+37+141+256+42+22+51+58+14+8+67+13+11+18+11+30+19
// 3/16/23: 3397 lines
// 3/23/23: 3998 lines
// 3/30/23: 4030 lines
// 4/24/23: 5427 lines
// 5/07/23: 5644 lines
// 6/01/23: 6180 lines
// 6/10/23: 6667 lines

import "./App.css";
import React from "react";

import { DanCarousel } from "./libs/DanCarousel.jsx";
import { ShowBlog } from "./libs/ShowBlog.jsx";
import { DAX } from "./libs/DanAjax.js";
import { DanLog } from "./libs/DanLog.js";

import { AccountBox, RegisterForm } from "./Account.jsx";
import { game } from "./game.jsx";
import { LocalMap } from "./LocalMap.jsx";
import { WorldMap } from "./WorldMap.jsx";

export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";
// These variables are important for the transition from dev mode to production mode. During development mode, the React front end behaves
// on it's own server. Therefore the back end functions as an API. In production mode, the React front end is on the same server as the
// back end, so file paths are relative to the React application

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [userData, setUserData] = React.useState(null);
    const [loginError, setLoginError] = React.useState("");
    const [worldMap, setWorldMap] = React.useState([]); // holds data about the world map
    const [worldCoords, setWorldCoords] = React.useState({}); // Where on the world map the player is. This isn't shown directly to the player, but
    // is needed to mark where the player is on the world map

    const [localWorkers, setLocalWorkers] = React.useState([]);

    // Manage startup processes, including auto-login
    React.useEffect(() => {
        DanLog.setup(serverURL + "/routes/log.php");

        if (typeof localStorage.getItem("userid") === "object") return; // Nothing is in localStorage right now; do nothing here
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
                // From here, everything is handled the same as a normal login
                onLogin(data);
            });
    }, []);

    function onLogin(pack) {
        // Handles the response when a user logs in. The same response is received when a user first signs up

        console.log("Login successful!", pack);

        // Use localStorage to keep the user's ID & access code, so autoLogin can work
        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

        game.setup(pack, setLocalWorkers);

        setPage("LocalMap");
    }

    function onSave() {
        // Manages saving the game to the server
        // No return value

        // Normally we wouldn't provide a save button; the game would save regularly, like every minute. But we need to get content to save
        // correctly first.

        // Saving map tile data is more complex than the rest of the data, because there's so much of it. My first efforts to save the map
        // took over 2 minutes to complete. We will solve this problem with multiple solutions
        // 1) Only tiles modified will be saved to the database. This will take care of most issues right now, but may have limits in
        //      late game activities
        // 2) Tiles will be saved to the database in groups, currently at 50. This will prevent the server from getting overrun with
        //      data to collect & save
        // 3) The server will save all the tiles to the database in one call.

        let sendTiles = game.tiles
            .filter((t) => t.modified)
            .map((t) => {
                let u = { ...t };
                // remove unneeded fields
                delete u.modified;
                delete u.image;
                delete u.landtype; // we won't need to send this either, since it will never change

                // items in tasks needs their task links converted to a task ID
                u.items = u.items.map((i) => {
                    if (i.inTask === 0) {
                        return { ...i };
                    }
                    return { ...i, inTask: i.inTask };
                });
                return u;
            });

        // Set up a function to manage sending tiles, chunk at a time
        function sendMoreTiles() {
            let batch = sendTiles.splice(0, 50);
            fetch(serverURL + "/routes/savetiles.php", DAX.serverMessage({ tiles: batch }, true))
                .then((res) => DAX.manageResponseConversion(res))
                .catch((err) => console.log(err))
                .then((data) => {
                    if (data.result !== "success") {
                        console.log(data);
                        return;
                    }
                    if (sendTiles.length === 0) {
                        console.log("All done!");
                        return;
                    }
                    sendMoreTiles();
                });
        }

        // Now we can send the actual save-game message. This manages everything except the tile content
        let pack = {
            workers: game.workers.map((w) => {
                // All tasks attached to this worker must be converted to an id
                // We must also avoid modifying the existing worker, so we will return a new object here
                return { ...w, tasks: w.tasks.map((t) => t.id) };
            }),
            structures: game.structures.map((st) => {
                return {
                    id: st.id,
                    name: st.name,
                    x: st.x,
                    y: st.y,
                    activeTasks: st.activeTasks,
                    //...st.onSave(),
                    ...(typeof st.onSave !== "undefined" && st.onSave()),
                };
            }),
            tasks: game.tasks.map((task) => {
                console.log(task);
                return {
                    id: task.id,
                    building: task.building === null ? 0 : task.building.id,
                    name: task.task === null ? "none" : task.task.name,
                    status: task.status,
                    taskType: task.taskType,
                    worker: task.worker === null ? 0 : task.worker.id,
                    targetx: task.targetx === null ? -1 : task.targetx,
                    targety: task.targety === null ? -1 : task.targety,
                    targetItem: task.targetItem, // used only in itemMove tasks
                    recipeChoices: task.recipeChoices,
                    quantity: task.quantity,
                    itemsTagged: task.itemsTagged.map((item) => {
                        // How do we find the same item from the same location?
                        // The only valid solution is to store the item's location along with its name & other factors
                        // That means we must first determine the location of this item; it could be with a worker, or on a tile
                        // Start by searching the workers; that part will be faster
                        let slot;
                        let worker = game.workers.find((w) => {
                            slot = w.carrying.findIndex((i) => i === item);
                            return slot !== -1;
                        });
                        if (typeof worker !== "undefined") {
                            // Got a hit on a worker
                            return { place: "worker", id: worker.id, slot: slot };
                        }
                        // Now try the tiles
                        let tile = game.tiles.find((t) => {
                            slot = t.items.findIndex((i) => i === item);
                            return slot !== -1;
                        });
                        if (typeof tile !== "undefined") {
                            return { place: "tile", x: tile.x, y: tile.y, slot: slot };
                        }
                        // Didn't find it in workers, or tiles? Something is wrong
                        console.log("Error in save(): could not locate item " + item.name + " anywhere");
                        return { place: "lost" };
                    }),
                    progress: task.progress,
                };
            }),
            unlockeditems: game.unlockedItems,
        };
        //DanLog.add("src/App.js->onSave()->before first message", "load-save", { note: "ready to send:", ...pack });
        fetch(serverURL + "/routes/save.php", DAX.serverMessage(pack, true))
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log(data);
                    return;
                }
                if (sendTiles.length === 0) {
                    console.log("No tile data to send...");
                    return;
                }
                sendMoreTiles();
            });
    }

    function PickPage() {
        // Determines which page of content to display, based on what `page` is set to
        switch (page) {
            case "HomePage":
                return <HomePage onLogin={onLogin} />;
            case "LocalMap":
                return <LocalMap workers={localWorkers} onSave={onSave} setPage={setPage} />;
            case "WorldMap":
                return (
                    <WorldMap
                        worldMap={worldMap}
                        worldCoords={worldCoords}
                        setWorldMap={setWorldMap}
                        setWorldCoords={setWorldCoords}
                        setPage={setPage}
                    />
                );
            default:
                return <>Error: Page type {page} has not been handled yet</>;
        }
    }

    return (
        <div>
            <div style={{ backgroundImage: "url(" + imageURL + "banner.png)", backgroundRepeat: "repeat-x" }}>
                <div id="titleblock">
                    <AccountBox onLogin={onLogin} user={userData} errorText={loginError} setErrorText={setLoginError} />
                    <div id="titletext">
                        Settlers & <br />
                        Warlords
                    </div>
                </div>
            </div>
            {PickPage()}
        </div>
    );
}

function HomePage(props) {
    // Displays content that the user sees when they first visit this site
    // Initial impressions are important! We want to display a series of pictures with text, that change out automatically

    const [signupMode, setSignupMode] = React.useState(false);

    return (
        <>
            <div
                style={{ display: "flex", justifyContent: "center", padding: 15, backgroundImage: "url(" + imageURL + "dirttexture.png)" }}
            >
                {signupMode === false ? (
                    <button style={{ fontSize: 20 }} onClick={() => setSignupMode(true)}>
                        Sign up today - it's free!
                    </button>
                ) : (
                    <RegisterForm onLogin={props.onLogin} style={{ backgroundColor: "white", padding: 5 }} />
                )}
            </div>
            <div
                style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "center",
                    backgroundImage: "url(" + imageURL + "dirttexture.png)",
                }}
            >
                <DanCarousel style={{ maxWidth: 600 }}>
                    <>
                        <p>
                            Settlers and Warlords is an online multiplayer game mixing Idle game concepts with Civilization-style strategy.
                            Start from natural land with a few workers.
                        </p>
                        <img src={imageURL + "homepage_basicland.png"} alt="basic land" />
                    </>
                    <>
                        <p>Harness your lands to develop technology, unlocking new resources and abilities</p>
                        <img src={imageURL + "homepage_gameshot.png"} alt="local map working" />
                    </>
                    <>
                        <p>Explore the world, discovering exotic structures, creatures and civilizations. Some helpful, others dangerous</p>
                        <img src={imageURL + "homepage_worldmap.png"} alt="world map" />
                    </>
                    <>
                        <p>
                            Trade with neighboring players to access greater abilities. Or wage war to conquer their lands. The more land
                            you control, the more neighbors you must manage.
                        </p>
                        <img src={imageURL + "homepage_neighbors.png"} alt="neighbor negotiations" />
                    </>
                    <>
                        <p>Refine your land and technology to dominate the world</p>
                        <img src={imageURL + "homepage_dominate.png"} alt="dominate the world" />
                    </>
                </DanCarousel>
            </div>
            <p style={{ textAlign: "center", fontWeight: "bold" }}>Development Blog</p>
            <ShowBlog style={{ backgroundColor: "white" }} serverURL={serverURL + "routes/getblog.php"} />
            <div style={{ height: 100 }}></div>
        </>
    );
}

export default App;
