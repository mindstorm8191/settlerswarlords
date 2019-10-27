import React from 'react';
import './App.css';
import {MyInput} from './MyInput.jsx';
import {WorldMap, getWorldTileCount} from './WorldMap.jsx';
import {LocalMap} from './LocalMap.jsx';
import {DAX} from './DanAjax.jsx';
import {danCommon} from './danCommon.js';

/* Task List
    1) Get this project onto Github
    2) Try to get the React portion of this project onto Netlify, connecting to my personal website as an API to provide data
    3) Update the database to have declared data sets for building costs. This will probably be two tables, one providing individual
        resource types, along with costs, and a second to group these items together.  It would be beneficial to have PHP functions
        to manage these
    4) Update the building structure to have a table to describe various processes single buildings can complete. These will be
        sent alongside the building data from the server
    5) Allow players to have the forage post start collecting resources. Let players decide if it should operate indefinitely or
        to a certain resource count (this will be a standard practice for all block types)
    6) Allow players to build a lean-to. This will be a first structure for players to house their colonists

    Later plans
    1) Figure out a way to accommodate more than just humans as being part of a block's population
*/

export const cardinalDirections = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

export const serverURL = "https://bookalong.x10host.com/settlerswarlords/ajax.php";
export const imageURL = "https://bookalong.x10host.com/settlerswarlords/img/";

function App() {
// This is the root of the page. Everything connects to this component.

    const [localMap, setLocalMap] = React.useState({});
    const [userData, setUserData] = React.useState({ id: 0, access: 0});
    const [curPage, setPage] = React.useState("home");
    const [worldMap, setWorldMap] = React.useState([]);
    const [worldCoords, setWorldCoords] = React.useState({ x: 0, y: 0 });
    // I think some part of this will be used for auto-login, once we can save data to localStorage

    function loadGame(data) {
        // Here, we have received information from the server, to provide us with a starting game state.  Go ahead and
        // store the fields so that we can re-render the page.
        console.log("Game loaded. Userid=" + data.userid);
        setUserData({
            id: data.userid,
            access: data.access,
        });
        localStorage.setItem("userid", data.userid);
        localStorage.setItem("access", data.access);

        data.mapcontent.updateflag = 0;

        setLocalMap(data.mapcontent);
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
                return (ele.x===mel.x && ele.y===mel.y);
            });
            if(match===undefined) return ele;
            return match;
        });
        //setLocalMap(localMap);
        setLocalMap({...localMap, minimap:newmap});
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
                                        biome: getWorldTileCount()-1
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
                console.log('Error in App.onPagePick: new page of '+ newpage +' not handled');
        }
    }

    // Instead of having everything determined here, we will use a pagepicker component to decide which page should be displayed
    return (
        <div style={{ backgroundImage: "url("+ imageURL +"banner.png)", backgroundRepeat: "repeat-x", margin:5 }}>
            <div style={{ width: "100%", minHeight: 150, margin:15 }}>
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
                    onChangeLocalTiles={props.onChangeLocalTiles}
                    onChangePage={props.onPagePick}
                />
            );
        case "worldmap":
            console.log("at PagePicker, userid=" + props.userData.id);
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
        </div>
    );
}

function RegisterForm(props) {
    // Provides a registration form for users to sign up to play the game
    // Prop fields:
    //      onLogin - what function to call once the user has successfully signed up.  Fetching data from the server
    //          is handled by this function; this component will pass the response data to onLogin.

    const [fields, setFields] = React.useState({ username: "", password: "", pass2: "", email: "" });
    function handleRegister() {
        // Handles starting the registration process
        //console.log("This part needs to be written. Reference RegisterForm->handleRegister");

        // Start by checking that pass 1 & 2 match
        if(fields.password!==fields.pass2) {
            console.log('Your passwords don\'t match. We need a better error message than something going to console.log');
            return;
        }

        // Now, send data to the server.
        fetch(serverURL, DAX.serverMessage("signup", {name: fields.username, password: fields.password, email: fields.email}, false))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
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
    function handleLogin() {
        fetch(serverURL, DAX.serverMessage("login", fields, false))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                // Send the server's response to the parent component
                props.onLogin(data);
            });
    }

    function inputUpdate(field, value) {
        // This is called whenever an input field gets updated. Handles storing the input's content within this component.
        fields[field] = value;
        setFields(fields);
    }

    return (
        <div style={{ float:'right' }}>
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
            </form>
        </div>
    );
}



export default App;
