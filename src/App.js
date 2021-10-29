import React from "react";
import "./App.css";

// Libraries of mine to help do things more easily
//import { DAX } from "./DanAjax.js";

// Project-specific components
import { AccountBox, RegisterForm } from "./comp_account.jsx";
//import { localMap_fillFromServerData, LocalMap } from "./comp_localMap.jsx";
//import { worldMap_fillFromServerData, WorldMap } from "./comp_worldMap.jsx";
//import { AdminPage } from "./comp_admin.jsx";
//import { game } from "./game.jsx";

/*  Version 7? Yes! ...Why?
    Version 6 had a lot more control over the production of resources. But I realized that, eventually, managing resources and
    creating new production setups was becoming too tedious. If things are tedious already, they're only going to get worse, as
    more production lines were created, just to keep a basic colony functioning.
    This time, we're going to focus more on workers and their tasks, instead of buildings. Buildings will still be the deciding
    factor in what actions can be completed, but workers will decide what must be done, and when. The process should go like this
    1) Player places a building down. This opens up multiple tasks that can be completed.
    2) Player picks a task to complete, then a worker to do that task... and leave them to complete it.
        a) If other workers don't have a task to complete, they will auto-assign themselves as helpers to another worker's task.
            We'll try to keep a balanced number of free workers to each task
        b) If a worker cannot complete a task because they need more basic resources, they will go ahead and create those
            resources first. Many of these can be delegated to helper workers
    3) Players can assign a worker to complete multiple tasks (in round robin fashion), or multiple workers to complete the same
        task
    This will start to appear much more like Dwarf Fortress... but that's okay! It'll also mean workers need to be given names...
    that could be difficult.

    We're using https://parser.name/api/generate-random-name/ to generate ranomized names

    Task list
    1) Get the homepage working again
    2) Set up a registration route
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
    3/13/2021 = 5588 lines
    3/27/2021 = 6448 lines
    4/3/2021  = 6985 lines
    4/11/2021 = 7885 lines
    4/17/2021 = 8328 lines
    4/24/2021 = 8663 lines
    5/1/2021  = 8759 lines
    5/8/2021  = 9488 lines
    5/29/2021 = 9819 lines
*/

//* Since the app is officially published when using npm run build, this leaves us trying to connect to the public server
export const serverURL = process.env.NODE_ENV === "production" ? "ajax.php" : "http://localhost:80/settlerswarlords/ajax.php";
export const imageURL = process.env.NODE_ENV === "production" ? "img/" : "http://localhost:80/settlerswarlords/img/";

function App() {
    return (
        <div className="app">
            <div style={{ backgroundImage: "url(" + imageURL + "banner.png)", backgroundRepeat: "repeat-x" }}>
                <div id="titleblock">
                    {/*<AccountBox onLogin={onLogin} user={userData} />*/}
                    <div id="titletext">
                        Settlers & <br />
                        Warlords
                    </div>
                </div>
            </div>
            <p>
                Settlers and Warlords is an online multiplayer game mixing Idle game concepts with Civilization-style strategy. Start from natural
                land with a few workers.
            </p>
            <img src={imageURL + "homepage_basicland.png"} />
            <p>Harness your lands to develop technology, unlocking new resources and abilities</p>
            <img src={imageURL + "homepage_gameshot.png"} />
            <p>Explore the world, discovering exotic structures, creatures and civilizations. Some helpful, others dangerous</p>
            <img src={imageURL + "homepage_worldmap.png"} />
            <p>
                Trade with neighboring players to access greater abilities. Or wage war to conquer their lands. The more land you control, the more
                players you must manage.
            </p>
            <p>Develop your land to dominate the world</p>
            <RegisterForm /> {/*onLogin={props.onLogin} />*/}
            <p style={{ fontWeight: "bold" }}>Important Updates</p>
            <p>
                Guess what? We're starting version 7! Maybe I AM a little crazy... but don't worry about that. After spending a lot of time on version
                6, I started to realize things weren't as fun as I had wanted it to be. I wanted resource production to be tetious, but this was TOO
                tedious. This time, work will be centered around a per-worker level. Workers are assigned tasks (or a series of tasks) and they
                determine how to accomplish that. This may feel a lot more like Dwarf Fortress, but I don't mind.
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
