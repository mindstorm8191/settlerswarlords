import React from "react";
import "./App.css";

import { DAX } from "./libs/DanAjax.js"; // A library to make Fetch calls a little easier

import { game } from "./game.jsx";
import { AccountBox, RegisterForm } from "./comp_account.jsx";
import { LocalMap } from "./comp_LocalMap.jsx";

/* Task List
1) Build a test HTML page that can view event variables so we can determine how to manage touch movements
2) Figure out how to pick which task a new worker at the RockKnapper gets. We might pick based on any tools not already present at the block
3) Finish the Rock Knapper, get workers to automatically build things there

Mobile user access
Currently, we have a means to detect screen width. We have found a way to keep browser-scrolling from happening on the map (on mobile), but no
way to actually scroll the map

Things to add later
1) Make a jQuery test to try out the touch event variables, see how to detect movement with it.
1) Add bush types to localmap worldgen: blueberry, grape, Firethorn, Buckthorn, Agarita, Gooseberry
2) Have workers follow A* pathfinding for fastest route.
3) Modify tree & bush placements to consider non-crossable paths due to thorns or overgrowth. Players will be able to clear these to make worker
    travel easier.
*/

// Accessing the server will work differently between if this project is in dev mode or in production mode.
// In Dev mode, since Create-React-App is running as a separate entity from the server, we will have to request
// content through a full URL (and work around CORS). Once the site is published, all this will be 'local' to the app
export const serverURL = process.env.NODE_ENV === "production" ? "server/" : "http://localhost:80/settlerswarlords/server/";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

/* *** Building project ***
   To build this project, run 'npm run build' from the command line.
   Note that you will need to change the homepage variable within package.json
*/

function App() {
    const [page, setPage] = React.useState("HomePage");
    const [userData, setUserData] = React.useState(null);
    const [localTiles, setLocalTiles] = React.useState(null);
    const [localWorkers, setLocalWorkers] = React.useState(null);
    const [loginError, setLoginError] = React.useState("");

    // Mobile display variables
    const [mobileMode, setMobileMode] = React.useState(false);
    const [mobileLeftPane, setMobileLeftPane] = React.useState(false); // This is set to true when the left pane is taking the full screen
    const [mobileRightPane, setMobileRightPane] = React.useState(false); // Same for the right pane

    React.useEffect(() => {
        const handleResize = () => {
            console.log("win-width " + window.innerWidth);
            if (window.innerWidth > 900) {
                setMobileMode(false);
                setMobileLeftPane(false);
            } else {
                setMobileMode(true);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => {
            // This will remove the event listener when we're done with it... which I guess is when the app is closed. Which I think wouldn't
            // really be necessary, but might as well keep it now
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Startup processes. We're primarily concerned about letting existing players log in automatically
    React.useEffect(() => {
        if (typeof localStorage.getItem("userid") == "object") return; // Do nothing if no data is in localStorage

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
                // At this point, everything is handled the same as a normal login
                onLogin(data);
            });
    }, []);

    function onLogin(pack) {
        console.log(pack);

        if (pack === null) {
            // Receiving null means the user is trying to log out
            localStorage.removeItem("userid");
            localStorage.removeItem("ajaxcode");
            game.stopGame();
            setPage("HomePage");
            setUserData(null);
            setLocalTiles(null);
            setLocalWorkers(null);
            //setWorldMap(null); // we need to clear this too, so the new user can load content
            return;
        }

        // Before we can get serious about running the game, we need to process some of the data received from the server
        // Right now, this only involves parsing JSON content from the items list at each tile
        pack.localTiles = pack.localTiles.map((ele) => {
            ele.items = JSON.parse(ele.items);
            return ele;
        });

        // Turn the worker data into objects. For new players, this will be relatively blank. This is now in the game object
        pack.workers = game.prepWorkers(pack.workers);

        // Use localStorage to keep the user's ID & access code
        localStorage.setItem("userid", pack.userid);
        localStorage.setItem("ajaxcode", pack.ajaxcode);

        game.setupGame(pack.localTiles, pack.workers, setLocalTiles, setLocalWorkers);
        game.startGame();

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
