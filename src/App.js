/*  Settlers & Warlords
    An MMO slash factory game focused on development instead of all-out war
*/

//...Brooks hospital room327

import React from "react";
import "./App.css";

import { DAX } from "./libs/DanAjax.js";
import { DanCarousel } from "./libs/DanCarousel.jsx";
import { ShowBlog } from "./libs/ShowBlog.jsx";

import { AccountBox, RegisterForm } from "./Account.jsx";
import { LocalMap } from "./LocalMap.jsx";
import { game } from "./game.jsx";

export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

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

        //console.log(pack.location);

        // Use the pack to set the player information
        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

        let location = JSON.parse(pack.location);
        setPlayerData({
            name: pack.username,
            x: location[0],
            y: location[1],
            z: location[2],
        });

        // Our map chunks are sent in a compacted way, only providing its object type, not its location. We can determine its location based on where
        // it is in this flat array. This will be limitedly helpful, and not ideal for combining with other chunks.
        // We could add in the coordinates of each tile as we store the map, but then we are dealing with a flat list of tiles. Searching for any
        // neighboring tiles will be horribly slow when dealing with a tile range of several hundred blocks.
        // Instead, we will drop these tiles into a 3D array. This will allow us to pick out any tiles whenever we wish.
        // This won't be ideal for displaying tiles, but we can filter down to the specific tiles we need easily enough.

        let chunkLocation = pack.localContent.chunkcoords;
        let tiles = [];
        pack.localContent.tiles.forEach((t, i) => {
            let x = i % 8;
            let y = Math.floor(i / 8.0) % 8;
            let z = Math.floor(i / 64.0);
            if (typeof tiles[chunkLocation[0] * 8 + x] === "undefined") {
                tiles[chunkLocation[0] * 8 + x] = [];
            }
            if (typeof tiles[chunkLocation[0] * 8 + x][chunkLocation[1] * 8 + y] === "undefined") {
                tiles[chunkLocation[0] * 8 + x][chunkLocation[1] * 8 + y] = [];
            }
            tiles[chunkLocation[0] * 8 + x][chunkLocation[1] * 8 + y][chunkLocation[2] * 8 + z] = { show: t.t, health: t.h };
        });
        setMapTiles(tiles);

        game.setup(setPlayerData, location, pack.username);
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

        console.log("Start: range from " + findBottom(tiles) + " to " + tiles.length);

        // With the new chunks, start adding the tiles from each chunk
        newChunkList.forEach((chunk) => {
            // Each of these will still be in JSON format, so we will have to convert it
            let chunkData = JSON.parse(chunk.content);
            console.log(chunk.chunkx, chunk.chunky, chunk.chunkz);
            chunkData.forEach((t, i) => {
                let x = i % 8;
                let y = Math.floor(i / 8.0) % 8;
                let z = Math.floor(i / 64.0);
                if (typeof tiles[chunk.chunkx * 8 + x] === "undefined") {
                    tiles[chunk.chunkx * 8 + x] = [];
                }
                if (typeof tiles[chunk.chunkx * 8 + x][chunk.chunky * 8 + y] === "undefined") {
                    tiles[chunk.chunkx * 8 + x][chunk.chunky * 8 + y] = [];
                }
                tiles[chunk.chunkx * 8 + x][chunk.chunky * 8 + y][chunk.chunkz * 8 + z] = { show: t.t, health: t.h };
            });
        });
        setMapTiles(tiles);
    }

    function PickPage() {
        // Determines which page of content should be displayed
        // No parameters. This will read the page field of App() to determine what to display

        switch (page) {
            case "HomePage":
                return <HomePage onLogin={onLogin} />;
            case "Game":
                return <LocalMap mapTiles={mapTiles} changeMapTiles={addTiles} player={playerData} />;
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
