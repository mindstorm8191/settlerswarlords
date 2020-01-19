import React from "react";
import "./App.css";
import { MyInput } from "./MyInput.jsx";
import { WorldMap, getWorldTileCount } from "./WorldMap.jsx";
import { LocalMap } from "./LocalMap.jsx";
import { DAX } from "./DanAjax.jsx";
import { danCommon } from "./danCommon.js";

/* Task List
    5) Send additional information to the user, such as food stores and other resources that have been produced
    3) Step up the protections on the server. Validate that input is valid, including the provided IP address. Check user input on
        client side before sending to server.
    3) Allow players to have the forage post start collecting resources. Let players decide if it should operate indefinitely or
        to a certain resource count (this will be a standard practice for all block types)
    4) Allow players to build a lean-to. This will be a first structure for players to house their colonists. Continue with
        the process of climbing a tech tree, opening access to tools and increasingly better equipment

    Later plans
    1) Figure out a way to accommodate more than just humans as being part of a block's population

    Code Lines count
    App.js       danCommon.js   common.php    localMap.php
        App.css     LocalMap.jsx    jsarray.php   processEvents.php
           MyInput.jsx  WorldMap.jsx   globals.php
              DanAjax.jsx   ajax.php      mapbuilder.php
    533+31+40+45+56+428+234+453+282+77+26+359+127+261 = 2952 lines
    11/6/19 - 2469 lines
    12/22/19 - 2923 lines
    01/18/20 - 2952 lines

    What to include when exporting the database
    * All table structures
    * Data for sw_resourceGroup, sw_structureAction, sw_structureItem, sw_structureType... that should be it!
*/

export const cardinalDirections = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 }
];

export const serverURL =
    process.env.NODE_ENV === "production"
        ? "http://bookalong.x10host.com/settlerswarlords/ajax.php"
        : "http://localhost:80/settlerswarlordsCRA/ajax.php";
export const imageURL =
    process.env.NODE_ENV === "production"
        ? "http://bookalong.x10host.com/settlerswarlords/img/"
        : "http://localhost:80/settlerswarlordsCRA/img/";

function App() {
    // This is the root of the page. Everything connects to this component.

    const [userData, setUserData] = React.useState({ id: 0, access: 0 });
    const [curPage, setPage] = React.useState("home");
    const [worldCoords, setWorldCoords] = React.useState({ x: 0, y: 0 });
    const [localMap, setLocalMap] = React.useState({});
    const [localMapBuildOptions, setLocalMapBuildOptions] = React.useState({});
    const [worldMap, setWorldMap] = React.useState([]);
    // I think some part of this will be used for auto-login, once we can save data to localStorage

    function loadGame(data) {
        // Here, we have received information from the server, to provide us with a starting game state.  Go ahead and
        // store the fields so that we can re-render the page.
        console.log("Game loaded. Userid=" + data.userid);
        setUserData({
            id: data.userid,
            access: data.access
        });
        localStorage.setItem("userid", data.userid);
        localStorage.setItem("access", data.access);

        data.mapcontent.updateflag = 0;

        setLocalMap(data.mapcontent);
        setLocalMapBuildOptions(data.buildoptions);
        setPage("localmap");
    }

    function onChangeLocalTiles(tileList) {
        // Allows a child component to update single tiles of the map
        // tileList - array of objects containing information about the new tiles to place down
        //            The existing tiles with matching X & Y coordinates will be replaced.

        // Our objective here is to run through all the tiles in localMap, and whenever a matching X & Y position is found in tileList,
        // apply the properties of that into localMap. We will then call setLocalMap with the new content

        //setLocalMap(localMap.minimap.map(ele => {
        const newmap = localMap.minimap.map(ele => {
            let match = tileList.find(mel => {
                return ele.x === mel.x && ele.y === mel.y;
            });
            if (match === undefined) return ele;
            return match;
        });
        //setLocalMap(localMap);
        setLocalMap({ ...localMap, minimap: newmap });
    }

    function onPagePick(newpage) {
        // Before displaying any page data, we need to ensure that we have content for it.
        switch (newpage) {
            case "localmap":
                setPage("localmap");
                break;
            case "worldmap":
                // Before we can display this, we need to first fetch the data from the server.
                fetch(serverURL, DAX.serverMessage("getworldmap", [], true))
                    .then(res => DAX.manageResponseConversion(res))
                    .catch(err => console.log(err))
                    .then(data => {
                        //////////
                        // With the world map data from the server, we don't have any of the unexplored tiles included here.
                        // We need to add them now.
                        //////////
                        let addons = data.worldmap.map(ele => {
                            console.log("CardinalDirections.length=" + cardinalDirections.length);
                            return cardinalDirections
                                .map(adjust => {
                                    // Determine if any of the worldmap blocks are already part of the world map
                                    console.log("Check direction [" + adjust.x + "," + adjust.y + "]");
                                    if (
                                        data.worldmap.some(inner => {
                                            let xone = parseInt(ele.x) + adjust.x;
                                            let yone = parseInt(ele.y) + adjust.y;
                                            console.log(`Check ${xone}=${inner.x} and ${yone}=${inner.y}`);
                                            if (xone === parseInt(inner.x) && yone === parseInt(inner.y)) {
                                                console.log("Passed");
                                                return true;
                                            } else {
                                                console.log("Failed");
                                                return false;
                                            }
                                            //return parseInt(ele.x) + adjust.x === inner.x && parseInt(ele.y) + adjust.y == inner.y;
                                        })
                                    ) {
                                        return undefined;
                                    }
                                    return {
                                        x: parseInt(ele.x) + adjust.x,
                                        y: parseInt(ele.y) + adjust.y,
                                        biome: getWorldTileCount() - 1
                                    };
                                })
                                .filter(check => {
                                    // Remove any results that are undefined
                                    return check !== undefined;
                                });
                        });
                        addons = danCommon.flatten(addons);
                        //console.log(addons);
                        // Now, we need to remove any duplicates in this list. Unfortunately, converting the list to a set doesn't work, except for
                        // primitives (unless you want to stringify to JSON & back).  We will need a different method.
                        //let filtered = [...new Set(addons)];
                        let filtered = [];
                        console.log(addons.length);
                        addons.forEach(ele => {
                            if (
                                !filtered.some(find => {
                                    return ele.x === find.x && ele.y === find.y;
                                })
                            ) {
                                filtered.push(ele);
                            }
                        });
                        console.log(filtered.length);
                        let wholemap = [...data.worldmap, ...filtered];
                        console.log(wholemap);

                        setWorldCoords({ x: data.currentx, y: data.currenty });
                        setWorldMap(wholemap);
                        setPage("worldmap");
                    });
                break;
            default:
                console.log("Error in App.onPagePick: new page of " + newpage + " not handled");
        }
    }

    // Instead of having everything determined here, we will use a pagepicker component to decide which page should be displayed
    return (
        <div style={{ backgroundImage: "url(" + imageURL + "banner.png)", backgroundRepeat: "repeat-x", margin: 5 }}>
            <div style={{ width: "100%", minHeight: 150, margin: 15 }}>
                <LoginForm onLogin={loadGame} />
                <div style={{ fontSize: "40px" }}>
                    Settlers & <br />
                    Warlords
                </div>
            </div>
            <PagePicker
                pageSelect={curPage} /* specifically for PagePicker */
                onLogin={loadGame} /* used only for HomePage  */
                userData={userData}
                localMap={localMap}
                localMapBuildOptions={localMapBuildOptions}
                onChangeLocalTiles={onChangeLocalTiles}
                onPagePick={onPagePick}
                worldMap={worldMap}
                worldCoords={worldCoords}
            />
        </div>
    );
}

function PagePicker(props) {
    // Decides which page of content should be displayed.  Generally determined by the pageSelect prop.
    // Prop fields:
    //      pageSelect - text determining what page to display. Data that is actually used will be determined by that
    //      onLogin - a function that is called when the user logs in or signs up
    //      userData - object containing user information. Most important is the biome and population of the local map
    //      localMap - array of objects, each containing information about a tile of the local map
    //      onChangeLocalTiles - function that is called whenever the contents of any tiles has changed
    //      onPagePick - function that is called when user selects a new page to view. Note that data collection for that
    //                   page isn't handled until being returned to the root React component
    //      worldMap - array of objects, each contaning information about a square of the world map
    //      worldCoords - object containing x & y, representing the world coordinates that the current player is located at

    switch (props.pageSelect) {
        case "home":
            return <HomePage onLogin={props.onLogin} />;
        case "localmap":
            return (
                <LocalMap
                    localMap={props.localMap}
                    localMapBuildOptions={props.localMapBuildOptions}
                    onChangeLocalTiles={props.onChangeLocalTiles}
                    onChangePage={props.onPagePick}
                />
            );
        case "worldmap":
            return (
                <WorldMap
                    worldMap={props.worldMap}
                    worldCoords={props.worldCoords}
                    curPop={props.userData.population}
                    userId={props.userData.id}
                    onChangePage={props.onPagePick}
                />
            );
        default:
            return <div>We failed to find content for page={props.pageSelect}</div>;
    }
}

function HomePage(props) {
    // Shows the content used on the home page.
    // Prop fields:
    //      onLogin - what function to call, once the user has successfully signed up. Note that actual logging in is handled
    //          directly on the header bar portion

    return (
        <div>
            <p>
                Settlers and Warlords is an online multiplayer game focused on land and tech development. Cultivate your
                lands to support your civilization and its growth. Then use new technologies to improve your lands even
                further. Acquire greater amounts of land to support an increasing population. Negotiate with neighboring
                colonies to create trade deals, or support each other by fortifying your bordering lands against mutual
                enemies. Outfit your armies with your best tech to wage war and capture enemy lands.
            </p>
            <RegisterForm onLogin={props.onLogin} />
            <p>
                Welcome to my latest project! This is mostly a hobby project, but I am still using it to practice my
                programming skills and learn new tools. This game is hardly playable, there is so much left to add. The
                more features I add, the more there is that needs to be added. But that's just how project development
                goes, sometimes.
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

function ErrorBox(props) {
    // Displays a full-page error box to the user. Useful for displaying complex errors. Will provide an accept button to
    // Prop fields:
    //      content - Text to display to the user
    //      onContinue - callback function called when the error has been received, to allow the calling component to remove the box

    return (
        <div
            style={{
                /* This is the container */
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                /*margin:'auto',*/
                zIndex: 1,
                justifyContent: "center",
                alignItems: "center"
            }}
        >
            <div
                style={{
                    /* This is the overlay, to set the background grey */
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    background: "gray",
                    opacity: 0.7
                }}
            ></div>
            <div
                style={{
                    position: "absolute",
                    margin: "auto",
                    zIndex: 2,
                    border: "4px solid red",
                    background: "white",
                    padding: 5,
                    opacity: 1.0
                }}
            >
                <p>{props.content}</p>
                <button onClick={props.onContinue}>Okay</button>
            </div>
        </div>
    );
}

function RegisterForm(props) {
    // Provides a registration form for users to sign up to play the game
    // Prop fields:
    //      onLogin - what function to call once the user has successfully signed up.  Fetching data from the server
    //          is handled by this function; this component will pass the response data to onLogin.

    const [fields, setFields] = React.useState({ username: "", password: "", pass2: "", email: "" });
    const [userError, setError] = React.useState("");
    const [serverError, setServerError] = React.useState("");

    function handleRegister() {
        // Handles starting the registration process
        //console.log("This part needs to be written. Reference RegisterForm->handleRegister");

        // Start by checking that pass 1 & 2 match
        if (fields.password !== fields.pass2) {
            setError("Your passwords don't match. We need a better error message than something going to console.log");
            return;
        }

        // Check that the username doesn't contain any weird characters
        if (danCommon.hasAny(fields.username, ".,~`!#$%^&*()+=[]{};:\"<>?/|'\\")) {
            setError("You cannot use special characters for your username");
            return;
        }
        if (danCommon.hasAny(fields.email, " ~`!#$%^&*()+=[]{};:\",<>?/|'\\")) {
            setError("You cannot use special characters for your email");
            return;
        }
        if (fields.username.length < 3) {
            setError("Please provide a good username, to set you apart from others");
            return;
        }
        if (fields.email.length < 5) {
            setError("Please provide a valid email address.");
            return;
        }

        // Also ensure the email address has a valid format
        if (
            fields.email.indexOf(".") === -1 || // email has a dot
            fields.email.indexOf(".") === fields.email.length - 1 || // dot is not last character
            fields.email.indexOf(".") === 0 || // dot is not first character
            fields.email.indexOf("@") === -1 || // email has a @
            fields.email.indexOf("@") === 0 || // @ is not first character
            fields.email.indexOf("@") === fields.email.length - 1 || // @ is not last character
            fields.email.indexOf("@", fields.email.indexOf("@") + 1) !== -1 || // email does not have two @'s
            fields.email.indexOf("@.") !== -1 // domain does not start with .
        ) {
            setError("Please provide a valid email address");
            return;
        }

        // Now, send data to the server.
        fetch(
            serverURL,
            DAX.serverMessage(
                "signup",
                { username: fields.username, password: fields.password, email: fields.email },
                false
            )
        )
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                if (data.result !== "success") {
                    setServerError(data.message);
                    return;
                }
                // Send the server's response to the parent component. This will be the same content as if they had only logged in.
                props.onLogin(data);
            });
    }

    function inputUpdate(field, value) {
        // This is called whenever an input field gets updated. Handles storing the input's content within this component
        // (since it seems that accessing it on demand isn't an option)
        // field - name of the field to update
        // value - new value to store there
        fields[field] = value;
        setFields(fields);
    }

    return (
        <div>
            <div style={{ fontSize: 20 }}>Sign up today - its free</div>
            <p className="singleline">
                <MyInput placeholder="Username" onUpdate={inputUpdate} fieldName="username" />
            </p>
            <p className="singleline">
                <MyInput placeholder="Password" onUpdate={inputUpdate} fieldName="password" />
            </p>
            <p className="singleline">
                <MyInput placeholder="Pass Again" onUpdate={inputUpdate} fieldName="pass2" />
            </p>
            <p className="singleline">
                <MyInput placeholder="Email" onUpdate={inputUpdate} fieldName="email" onEnter={handleRegister} />
            </p>
            <p className="singleline">
                <input type="button" value="Sign Up" onClick={handleRegister} />
            </p>
            {userError === "" ? (
                ""
            ) : (
                <p className="singleline" style={{ color: "red" }}>
                    {userError}
                </p>
            )}
            {serverError === "" ? (
                ""
            ) : (
                <ErrorBox
                    content={serverError}
                    onContinue={() => {
                        setServerError("");
                    }}
                />
            )}
        </div>
    );
}

function LoginForm(props) {
    // Manages the login form at the top right of the homepage.  Once the user is logged in (or registered), this will be
    // replaced with a user profile section
    // Prop fields:
    //      onLogin - what function to call once the user has successfully logged in. Fetching data from the server is
    //          already handled by this function; this component will pass the response data to onLogin.

    const [fields, setFields] = React.useState({ username: "", password: "" });
    const [userError, setError] = React.useState("");
    const [serverError, setServerError] = React.useState("");

    function handleLogin() {
        // Make sure the user has filled out some data, before sending it to the server
        if (fields.username === "") {
            setError("Please provide a user name & password");
            return;
        }
        if (fields.password === "") {
            setError("Please provide your password");
            return;
        }
        fetch(serverURL, DAX.serverMessage("login", fields, false))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                // Send the server's response to the parent component
                if (data.result !== "success") {
                    setServerError(data.message);
                    return;
                }

                props.onLogin(data);
            });
    }

    function inputUpdate(field, value) {
        // This is called whenever an input field gets updated. Handles storing the input's content within this component.
        fields[field] = value;
        setFields(fields);
    }

    return (
        <div style={{ float: "right" }}>
            <form id="loginform">
                <p className="singleline">
                    <MyInput placeholder="Username" onUpdate={inputUpdate} fieldName="username" />
                </p>
                <p className="singleline">
                    <MyInput placeholder="Password" onUpdate={inputUpdate} fieldName="password" onEnter={handleLogin} />
                </p>
                <p className="singleline">
                    <input type="button" value="Login" onClick={handleLogin} />
                </p>
                {userError === "" ? (
                    ""
                ) : (
                    <p className="singleline" style={{ color: "red" }}>
                        {userError}
                    </p>
                )}
                {serverError === "" ? (
                    ""
                ) : (
                    <ErrorBox
                        content={serverError}
                        onContinue={() => {
                            setServerError("");
                        }}
                    />
                )}
            </form>
        </div>
    );
}

export default App;
