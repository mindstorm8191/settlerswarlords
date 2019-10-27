// WorldMap.jsx
// manages content for the world map page

import React from 'react';
import {MyInput} from './MyInput.jsx';
import {DAX} from './DanAjax.jsx';
import {serverURL, imageURL} from './App.js';

const worldmapImages = [
    "worldgrass.png",
    "worldforest.png",
    "worlddesert.png",
    "worldswamp.png",
    "worldwater.png",
    "worldunseen.png" // The game is set up to use this element as the last option, no matter how many images are available
];

const worldmapTilenames = ["Grasslands", "Forest", "Desert", "Swamp", "Water", "Unexplored Land"];

export function getWorldTileCount() {
    // Returns the number of tile types in the World Map Images list. This information is needed in the code that adds unexplored lands
    // to the map, since that tile is always used for unexplored land.
    
    return worldmapImages.length;
}

export function WorldMap(props) {
    // Full-page content. Handles displaying the map, as the current user understands it
    // prop fields:
    //      worldCoords - object with properties x and y, providing the coordinates of where the user is currently located
    //      worldMap - array of objects representing land tiles of the world map. Note that the server will only send
    //          information about tiles that the user is aware of. Client code will add additional tiles representing lands
    //          that can be explored.
    //      curPop - Value of the current population for where the user is currently located
    //      userId - ID of the current user. Used to determine if they own the selected land.

    //return <div>Hello world map! We have {props.worldMap.length} tiles</div>;
    console.log("You are at [" + props.worldCoords.x + "," + props.worldCoords.y + "], userid=" + props.userId);
    const [selected, pickSelected] = React.useState(null);

    function clearSelected() {
        pickSelected(null);
    }

    return (
        <div
            style={{
                width: "100%",
                height: window.innerHeight - 170,
                position: "relative",
                overflow: "hidden"
            }}
        >
            {/*At the top of the map, we need to display a link to return to the local map*/}
            <div style={{backgroundColor:'white'}}>
                <span className="fakelink" onClick={() => {props.onChangePage("localmap");}}>Local Map</span>
            </div>
            {props.worldMap.map((ele,key) => {
                console.log("[" + ele.x + "," + ele.y + "]");
                return (
                    <div
                        style={{
                            display: "block",
                            position: "absolute",
                            width: 55,
                            height: 55,
                            top: ele.y * 55 + (window.innerHeight - 170) / 2,
                            left: ele.x * 55 + window.innerWidth / 2
                        }}
                        key={key}
                    >
                        <img
                            src={imageURL + worldmapImages[ele.biome]}
                            onClick={() => {
                                pickSelected(ele);
                            }}
                            alt='land'
                        />
                        {ele.x === props.worldCoords.x && ele.y === props.worldCoords.y ? (
                            <img
                                src={imageURL +"youarehere.png"}
                                style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
                                alt='You are here'
                            />
                        ) : (
                            ""
                        )}
                    </div>
                );
            })}
            {selected != null ? (
                <WorldTile d={selected} homePop={props.curPop} userId={props.userId} onClose={clearSelected} />
            ) : (
                ""
            )}
        </div>
    );
}

function WorldTile(props) {
    // Handles displaying information about a specific world map tile. If a tile has not been selected, no information will
    // be shown.
    // prop fields:
    //      d - represents a map tile that was selected. This may be set to null.
    //      homePop - how much population is at the player's current location
    //      userId - ID of the current user. Used to determine if the user owns the selected land

    const [action, actionCompleted] = React.useState("");
    const [coords, updateCoords] = React.useState({
        x: props.d === null ? null : props.d.x,
        y: props.d === null ? null : props.d.y
    });
    // We are using this coords field for the sole purpose of detecting when the selected tile has changed. When it does,
    // we need to remove the current action state-value.

    function handleAction(changes) {
        actionCompleted("Troops are on their way");
    }

    function pickResponse() {
        if (action !== "") return <span style={{ fontWeight: "bold" }}>{action}</span>;
        if (props.d.biome === worldmapImages.length - 1)
            return <WorldTileSendExpedition r={props.d} pop={props.homePop} result={handleAction} />;
        if (parseInt(props.d.owner) === parseInt(props.userId)) {
            // Aka this user owns this land
            return <div>My land!</div>;
        }
        if (parseInt(props.d.owner) === 0) {
            // Aka nobody owns this land - conquer it!
            return <div>Open for conquering</div>;
        }
        return (
            <div>
                ID={props.d.owner} else owns this place (you are {props.userId})
            </div>
        );
    }

    if (props.d === null) return "";

    if (coords.x !== props.d.x || coords.y !== props.d.y) {
        console.log("Update triggered!");
        actionCompleted("");
        updateCoords({ x: props.d.x, y: props.d.y });
    }

    return (
        <div
            style={{
                display: "block",
                position: "absolute",
                border: "1px solid",
                top: props.d.y * 55 + (window.innerHeight - 170) / 2,
                left: (parseInt(props.d.x) + 1) * 55 + window.innerWidth / 2,
                backgroundColor: "white",
                padding: 10
            }}
        >
            <div style={{ display: "block" }}>
                <div style={{ position: "absolute", top: 4, right: 10 }}>
                    <img src={imageURL +"exit.png"} onClick={props.onClose} alt='eXit' />
                </div>
                <div
                    style={{
                        textAlign: "center",
                        fontWeight: "bold"
                    }}
                >
                    {worldmapTilenames[props.d.biome]}
                </div>
            </div>
            {pickResponse()}
        </div>
    );
}

function WorldTileSendExpedition(props) {
    // Provides a method for a user to send an expedition to a given location.
    // prop fields:
    //      f - represents the map tile which is currently selected, of the world map
    //      pop - How much population exists at the player's current location
    //      result - What function is called when the user sends an expedition

    const [units, updateUnits] = React.useState(1);

    function StartExpedition() {
        // Allows the user to send an expedition.
        // We will handle sending the request to the server here, in case of errors. If successful, we will have to update
        // all the way back to the root component.
        console.log("Sending message to server");
        fetch(
            serverURL,
            DAX.serverMessage(
                "doaction",
                {
                    command: "expedition",
                    x: props.r.x,
                    y: props.r.y,
                    numtroops: units
                },
                true
            )
        )
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                if (data.result === "success") {
                    console.log("Server replied successfully");
                    props.result({ action: "expedition", popadjust: -units, foodadjust: -units });
                } else {
                    console.log("Server replied with error");
                    console.log(data);
                }
            });
    }

    // note: the onUpdate function returned from MyInput has two parameters, not one.
    return (
        <div>
            <p className="singleline">
                <span className="fakelink" onClick={StartExpedition}>
                    Send Expedition
                </span>
            </p>
            <p className="singleline">Distance: 1 blocks</p>
            <p className="singleline" style={{ whiteSpace: "no-wrap" }}>
                Travellers: <MyInput fieldName="units" onUpdate={(r, s) => updateUnits(s)} default="1" />
                (max {parseInt(props.pop) - 1})
            </p>
            <p className="singleline">Minimum food needed: {units * 4}</p>
            <p className="singleline">Expected return time: 10 minutes</p>
        </div>
    );
}
