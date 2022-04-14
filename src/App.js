import React from "react";
import "./App.css";

import { DAX } from "./libs/DanAjax.js"; // A library to make Fetch calls a little easier

import { AccountBox, RegisterForm } from "./comp_account.jsx";

// Accessing the server will work differently between if this project is in dev mode or in production mode.
// In Dev mode, since Create-React-App is running as a separate entity from the server, we will have to request
// content through a full URL (and work around CORS). Once the site is published, all this will be 'local' to the app
export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

/* *** Building project ***
   To build this project, run 'npm run build' from the command line.
   Note that you will need to change the homepage variable within package.json
*/

const game = {
    blocks: [], // All functioning buildings
    tiles: [], // All map tiles of the local map
    timerLoop: null, // This gets updated to a timer handle when the game starts
    updateWorkers: null, // This gets assigned to React's setWorkers call
    updateLocalMap: null, // This also gets assigned to a React callback
    workers: [], // List of all workers (with stats)
    tickTime: 0,

    setupGame: () => {
        // A simple function to handle setting up game basics
        //
    },

    startGame: () => {
        // A simple function to handle starting the game's timer
        game.tickTime = new Date().valueOf();
        setTimeout(game.tick, 50);
    },

    tick: () => {
        // Handles updates to the local world
    },
};

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [userData, setUserData] = React.useState(null);
    const [localTiles, setLocalTiles] = React.useState(null);
    const [localWorkers, setLocalWorkers] = React.useState(null);
    const [loginError, setLoginError] = React.useState("");

    function onLogin(pack) {
        console.log(pack);

        // Before we can get serious about running the game, we need to process some of the data received from the server
        // Right now, this only involves parsing JSON content from the items list at each tile
        pack.localTiles = pack.localTiles.map((ele) => {
            ele.items = JSON.parse(ele.items);
            return ele;
        });

        // Turn the worker data into objects. For new players, this will be relatively blank
        let lastWorkerId = 1;
        pack.workers = pack.workers.map((ele) => {
            ele.currentTask = "";
            ele.carrying = [];
            ele.id = lastWorkerId;
            lastWorkerId++;
            return ele;
        });

        // Use localStorage to keep the user's ID & access code
        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

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

function LocalMap(props) {
    return <div>Hello world!</div>;
}

function HomePage(props) {
    return (
        <>
            <p>
                Settlers and Warlords is an online multiplayer game mixing Idle game concepts with Civilization-style strategy. Start from natural land with a
                few workers.
            </p>
            <img src={imageURL + "homepage_basicland.png"} alt="basic land" />
            <p>Harness your lands to develop technology, unlocking new resources and abilities</p>
            <img src={imageURL + "homepage_gameshot.png"} alt="local map working" />
            <p>Explore the world, discovering exotic structures, creatures and civilizations. Some helpful, others dangerous</p>
            <img src={imageURL + "homepage_worldmap.png"} alt="world map" />
            <p>
                Trade with neighboring players to access greater abilities. Or wage war to conquer their lands. The more land you control, the more neighbors
                you must manage.
            </p>
            <img src={imageURL + "homepage_neighbors.png"} alt="neighbor negotiations" />
            <p>Develop your land to dominate the world</p>
            <RegisterForm onLogin={props.onLogin} />
            <p style={{ fontWeight: "bold" }}>Important Updates</p>
            <p>
                Guess what? We're starting version 7! Maybe I AM a little crazy... but nevermind that. After spending a lot of time on version 6, I started to
                realize things weren't as fun as I had wanted it to be. I wanted resource production to be tetious, but this was TOO tedious. This time, work
                will be centered around a per-worker level. Workers are assigned tasks (or a series of tasks) and they determine how to accomplish that. This
                may feel a lot more like Dwarf Fortress, but I don't mind.
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
