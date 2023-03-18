/*  Settlers & Warlords
    An MMO slash idle game focused on development instead of all-out war
*/

// Lines count
// src/app.js                          src/LocalMap.jsx                       server/libs/common.php             automationtree.md
//     src/app.css                         src/libs/DraggableMap.jsx              server/libs/DanGlobal.php         wartree.md
//        src/libs/DanCarousel.jsx             src/minimapTiles.jsx                  server/routes/autologin.php      worldgen.md
//            src/libs/ShowBlog.jsx               server/config.php                     server/routes/getblog.php        workercrafting.md
//               src/libs/DanAjax.js                server/finishLogin.php                 server/routes/log.php            tasklist.md
//                  src/libs/DanLog.js                 server/globals.php                     server/routes/login.php
//                     src/comp_account.jsx                server/libs/weightedRandom.php        server/routes/save.php
//                         src/libs/DanInput.jsx               server/getInput.php                  server/routes/signup.php
//                            src/libs/DanCommon.js               server/minimap.php                    resetgame.php
//                               src/libs/ErrorOverlay.jsx            server/libs/jsarray.php              README.md
//                                  src/game.jsx                          server/libs/clustermap.php          techtree.md
// 241+39+120+96+48+38+229+65+74+68+67+111+177+72+8+37+283+127+33+223+230+141+307+37+33+38+35+41+22+320+21+44+58+12+8+53+11+14
// 3/16/23: 3397 lines

import "./App.css";
import React from "react";

import { DanCarousel } from "./libs/DanCarousel.jsx";
import { ShowBlog } from "./libs/ShowBlog.jsx";
import { DAX } from "./libs/DanAjax.js";
import { DanLog } from "./libs/DanLog.js";

import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { game } from "./game.jsx";
import { LocalMap } from "./LocalMap.jsx";

export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [userData, setUserData] = React.useState(null);
    const [loginError, setLoginError] = React.useState("");

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

        game.setup(pack);

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
                // items in tasks needs their task links converted to a task ID
                u.items = u.items.map((i) => {
                    if (i.inTask === 0) {
                        return i;
                    }
                    return { ...i, inTask: i.inTask.id };
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
            workers: game.workers,
            structures: [],
            tasks: [],
            unlockeditems: [],
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
                return <LocalMap onSave={onSave} />;
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
