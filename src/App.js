/*  Settlers & Warlords
    An MMO slash factory game focused on development instead of all-out war
*/

// Lines count
// src/app.js                           src/game_tasks.jsx                         src/structures/FarmersPost.jsx              server/routes/autologin.php            server/routes/getblog.php              server/routes/worldmap.php         notes/futureprocesses.md
//     src/app.css                         src/worker.jsx                              src/structures/HayDryer.jsx                server/config.php                      server/routes/loadmap.php               resetgame.php                     notes/influences.md
//        src/libs/DanAjax.js                  src/itemstats.js                            src/structures/OpenDryer.jsx             server/common.php                       server/routes/log.php                   README.md                          notes/monetizationstrategies.md
//           src/libs/DanCarousel.jsx              src/structures/LeanTo.jsx                   src/structures/HuntersPost.jsx           server/libs/jsarray.php                 server/routes/login.php                notes/techtree.md                  notes/researchprocess.md
//               src/libs/ShowBlog.jsx                 src/structures/ForagePost.jsx               src/structures/ButcherShop.jsx           server/events.php                      server/routes/logout.php               notes/automationtree.md            notes/tasklist.md
//                  src/libs/DanLog.js                     src/structures/RockKnapper.jsx              src/structures/CampFire.jsx              server/getInput.php                    server/routes/save.php                notes/wartree.md
//                     src/Account.jsx                         src/structures/LoggersPost.jsx              src/structures/SewingShop.jsx           server/finishLogin.php                  server/routes/savetiles.php          notes/worldgen.md
//                         src/libs/DanInput.jsx                   src/structures/RopeMaker.jsx                src/structures/CampFire.jsx            server/generateMap.php                   server/routes/sendunits.php          notes/worldhistory.md
//                            src/libs/DanCommon.js                    src/structures/DirtSource.jsx               src/GameDisplay.jsx                    server/globals.php                       server/routes/signup.php            notes/magicsytem.md
//                               src/libs/ErrorOverlay.jsx                 src/structures/WaterSource.jsx              src/minimapTiles.jsx                   server/libs/weightedRandom.php           server/libs/DanGlobal.php          notes/undergroundbiomes.md
//                                  src/game.jsx                               src/structures/ClayFormer.jsx               src/WorldMap.jsx                       server/libs/clustermap.php              server/minimap.php                 notes/workercrafting.md
// 299+63+48+113+96+38+231+65+83+68+134+           85+     111+                                                    415+368+    33+8+307+230+    35+26+358+512+127+534+40+47+    43+31+             166+37+       22+60+60+27+32+204+13+11+28+11+75+190+25+17+84
// 3/16/23: 3397 lines
// 3/23/23: 3998 lines
// 3/30/23: 4030 lines
// 4/24/23: 5427 lines
// 5/07/23: 5644 lines
// 6/01/23: 6180 lines
// 6/10/23: 6667 lines
// 6/17/23: 7105 lines
// 6/24/23: 7528 lines
// 7/01/23: 8018 lines
// 7/14/23: 8835 lines
// 7/25/23: 9757 lines
// 8/17/24: 3914 lines (yes, this was a break of a whole year)
// 8/27/24: 4485 lines
// 11/26/24: 5232 lines
// 12/02/24: 5548 lines

import React from "react";
import * as Three from "three";
import { Canvas, useThree, useFrame, useLoader } from "@react-three/fiber";
//import { useGLTF } from "@react-three/drei";
import { TextureLoader } from "three/src/loaders/TextureLoader";

import "./App.css";

import { DAX } from "./libs/DanAjax.js";
import { DanCarousel } from "./libs/DanCarousel.jsx";
import { ShowBlog } from "./libs/ShowBlog.jsx";

import { AccountBox, RegisterForm } from "./Account.jsx";
import { game } from "./game.jsx";
import { ShowGame } from "./GameDisplay.jsx";

export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";
export const textureURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/getmedia.php?file=";
// These variables are important for the transition from dev mode to production mode. During development mode, the React front end behaves
// on it's own server. Therefore the back end functions as an API. In production mode, the React front end is on the same server as the
// back end, so file paths are relative to the React application

export const chunkSize = 8;

const chunksLoaded = []; // A flat list of chunk coordinates that have been loaded. This is for debugging purposes, to see what areas are being loaded

function findBottom(a) {
    // Returns the bottom index of an array. array.length assumes all arrays start on 0, and counts up from there. Our map array will run negative and positive
    let i = 0;
    while (typeof a[i] !== "undefined") {
        i--;
        if (i < -1000000000) {
            // 1 billion is far enough, I think
            console.log("Searched to -1,000,000,000, still not done? Something's fishy, we'll stop here.");
            return i;
        }
    }
    return i + 1;
}

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [playerData, setPlayerData] = React.useState(null);
    const [mapTiles, setMapTiles] = React.useState([]);
    const [loginError, setLoginError] = React.useState(""); // A simple message entry that is shared with Account

    // Manage startup processes, including auto-login
    React.useEffect(() => {
        if (typeof localStorage.getItem("userid") === "object") return; // Nothing is currently in localStorage; do nothing here
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
                onLogin(data);
            });
    }, []);

    function onLogin(pack) {
        // Handles allowing the player to log in, and sending them to the game screen

        if (pack === null) {
            // Receiving null means the player is trying to log out
            localStorage.removeItem("userid");
            localStorage.removeItem("ajaxcode");
            setPage("HomePage");
            setMapTiles([]);
            setPlayerData(null);
            return;
        }

        // Use the pack to set the player information
        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

        setPlayerData({
            name: pack.username,
            x: pack.location[0],
            y: pack.location[1],
            z: pack.location[2],
        });

        // Our map chunks are sent in a compacted way, only providing its object type, not its location. We can determine its location based on where
        // it is in this flat array. This will be limitedly helpful, and not ideal for combining with other chunks.
        // We could add in the coordinates of each tile as we store the map, but then we are dealing with a flat list of tiles. Searching for any
        // neighboring tiles will be horribly slow when dealing with a tile range of several hundred blocks.
        // Instead, we will drop these tiles into a 3D array. This will allow us to pick out any tiles whenever we wish.
        // This won't be ideal for displaying tiles, but we can filter down to the specific tiles we need easily enough.

        let tiles = [];
        let chunkData = JSON.parse(pack.localContent.content);

        chunkData.forEach((t, i) => {
            let x = i % chunkSize;
            let y = Math.floor(i / chunkSize) % chunkSize;
            let z = Math.floor(i / (chunkSize * chunkSize));
            if (typeof tiles[pack.localContent.chunkx * chunkSize + x] === "undefined") {
                tiles[pack.localContent.chunkx * chunkSize + x] = [];
            }
            if (typeof tiles[pack.localContent.chunkx * chunkSize + x][pack.localContent.chunky * chunkSize + y] === "undefined") {
                tiles[pack.localContent.chunkx * chunkSize + x][pack.localContent.chunky * chunkSize + y] = [];
            }
            tiles[pack.localContent.chunkx * chunkSize + x][pack.localContent.chunky * chunkSize + y][
                pack.localContent.chunkz * chunkSize + z
            ] = {
                show: t.t,
                floor: t.f,
                health: t.h,
                items: t.i,
            };
        });
        setMapTiles(tiles);

        // Worker content is passed directly from the server database to game.setup().

        game.setup(tiles, setPlayerData, pack.location, pack.username, pack.workers);
        game.start();

        setPage("Game");
    }

    function addTiles(newChunkList) {
        //function addTiles(oldTiles, newChunkList) {
        // Allows new tiles to be added to the map.
        // new ChunkList - data received from the server. It should be a list of chunk records, including chunk coordinates
        // No return value. This will modify the tile map

        // Normally, we would use the spread operator to create a copy of the array, so React treats it as a new object. But Spread doesn't
        // account for negative index values, so it won't work with out map. We'll have to do this manually, instead
        let tiles = [];
        for (let x = findBottom(mapTiles); x < mapTiles.length; x++) {
            tiles[x] = mapTiles[x];
        }

        //console.log("Start: range from " + findBottom(tiles) + " to " + tiles.length);

        // With the new chunks, start adding the tiles from each chunk
        newChunkList.forEach((chunk) => {
            // Each of these will still be in JSON format, so we will have to convert it
            let chunkData = JSON.parse(chunk.content);
            //console.log(chunk.chunkx, chunk.chunky, chunk.chunkz);
            chunkData.forEach((t, i) => {
                let x = i % chunkSize;
                let y = Math.floor(i / chunkSize) % chunkSize;
                let z = Math.floor(i / (chunkSize * chunkSize));
                if (typeof tiles[chunk.chunkx * chunkSize + x] === "undefined") {
                    tiles[chunk.chunkx * chunkSize + x] = [];
                }
                if (typeof tiles[chunk.chunkx * chunkSize + x][chunk.chunky * chunkSize + y] === "undefined") {
                    tiles[chunk.chunkx * chunkSize + x][chunk.chunky * chunkSize + y] = [];
                }
                tiles[chunk.chunkx * chunkSize + x][chunk.chunky * chunkSize + y][chunk.chunkz * chunkSize + z] = {
                    show: t.t,
                    floor: t.f,
                    health: t.h,
                    items: t.i,
                };
            });
        });
        setMapTiles(tiles);
        game.tiles = tiles;
    }

    function PickPage() {
        // Determines which page of content should be displayed
        // No parameters. This will read the page field of App() to determine what to display

        switch (page) {
            case "HomePage":
                return <HomePage onLogin={onLogin} />;
            case "Game":
                //return <LocalMap mapTiles={mapTiles} changeMapTiles={addTiles} player={playerData} />;
                return <ShowGame mapTiles={mapTiles} changeMapTiles={addTiles} player={playerData} />;
            default:
                return <>Error: Page type {page} has not been handled yet</>;
        }
    }

    return (
        <div className="body">
            <div style={{ backgroundImage: "url(" + imageURL + "banner.png)", backgroundRepeat: "repeat-x" }}>
                <AccountBox user={playerData} onLogin={onLogin} errorText={loginError} setErrorText={setLoginError} />
                <div id="titleblock">
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
                <DanCarousel style={{ maxWidth: 470 }} displayTime={8000} transitionTime={2000} showProgressBar={true}>
                    <>
                        <p>
                            Settlers and Warlords is an online multiplayer game mixing Factory-builder concepts with Civilization-style
                            strategy. Start from natural land with a few workers.
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
