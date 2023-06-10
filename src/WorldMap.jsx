/*  WorldMap.jsx
    Contains the world map and functions related to it
    For the game Settlers & Warlords
*/

// c = sqrt(a^2 + b^2);
// c = sqrt(25+25) = sqrt(50) = 7.07

import React from "react";
import { DraggableMap, FixedPositionChild, clearDragFlag } from "./libs/DraggableMap.jsx";
import { DanInput } from "./libs/DanInput.jsx";
import { DAX } from "./libs/DanAjax.js";


import { serverURL, imageURL } from "./App.js";

const worldTileData = [
    {id:0, biome:'Grassland', desc:'Large fields of grasses', img:'grass.png'},
    {id:1, biome:'Forest',    desc:'Heavy forests with shady floors', img:'forest.png'},
    {id:2, biome:'Desert',    desc:'Endless sands with scarce vegetation', img:'water.png'},
    {id:3, biome:'Swamp',            desc:'Wet lands, with water everywhere', img:'swamp.png'},
    {id:4, biome:'Water',            desc:'Deep waters with few islands', img:'water.png'},
    {id:5, biome:'Jungle',           desc:'Rich Jungle, full of life', img:'jungle.png'},
    {id:6, biome:'Frozen Wasteland', desc:'Lands covered in ice and snow', img:'frozen.png'},
    {id:7, biome:'Lavascape',        desc:'Barren rocks with lava puddles everywhere', img:'lava.png'},
    {id:8, biome:'Unexplored',       desc:'Nobody has been here yet', img:'unknown.png'},
    // We should handle actively exploring tiles as events that can be shown here
];

export function WorldMap(props) {
    // Handles displaying the world map to the player. Note that they can only view the world map as they know it. Information will be
    // limited based on what map tiles they have received reports from, and delayed based on the last received report of that land.
    // Also note that if a traveller travels across multiple tiles, they will collect data about each of those tiles, dated to the time
    // they were on them. Travel on foot will be about 10 minutes per tile (or 14 minutes per tile travelling diagonally).
    // prop fields - data
    //      worldMap - array of world map tiles that the player can view
    //      worldCoords - object containing x & y coords of the current player's location
    // prop fields - functions
    //      setWorldMap - changes the world map to new content
    //      setWorldCoords - changes the location on the map that the player is at
    //      setPage - changes the current page displayed to the user

    const [selectedTile, setSelectedTile] = React.useState(null);
    const [command, setCommand] = React.useState('');

    function updateMap(newTileList) {
        // Manages updating tiles on the map that have changed, for whatever reason
        // newTileList - list of tile data that has changed
        // No return value. This will trigger updates up the React chain

        console.log('We have '+ newTileList.length +' tiles to update');
        let worldMap = props.worldMap.map(tile=>{
            // See if this tile is marked in the new tiles list
            let slot = newTileList.findIndex(t=>t.x===tile.x && t.y===tile.y);
            if(slot===-1) return tile;
            console.log('Got hit with slot='+ slot);
            return newTileList[slot];
        });
        
        // With everything updated, now feed it up the line
        fillMapBorders(worldMap);
    }

    function fillMapBorders(content) {
        // Manages filling in the borders of all tiles with an unexplored tile, giving users the opportunity to expand their knowledge of
        // the world
        // content - list of all tiles this user has received from the server. This can already contain unexplored tiles, they will be
        //      skipped over anyway
        // No return value. The updated world map content will be fed up the line

        for (let i = 0; i < content.length; i++) {
            // If any tiles are listed as unexplored, they can be skipped over. We were assuming that unexplored tiles signaled the
            // end of the original list, but that's not the case anymore
            if (content[i].biome === 8) continue;
            // From this tile, check the surrounding tiles for existing hits
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    let match = content.find((r) => r.x === content[i].x + dx && r.y === content[i].y + dy);
                    if (typeof match === "undefined") {
                        // There is no tile here at all. Let's create one now
                        // Each tile contains the following data: x,y,lastcheck,owner,civ,population,biome
                        content.push({
                            x: content[i].x + dx,
                            y: content[i].y + dy,
                            biome: 8,
                            lastcheck: "",
                            owner: 0,
                            civ: 0,
                            population: 0,
                            isexploring: 0
                        });
                    }
                }
            }
        }
        // Now update the world map for all React components
        console.log('Map now has '+ content.length +' tiles');
        props.setWorldMap(content);
    }

    // If there is no world map data, we will need to load some content. While it loads, provide a loading screen
    if (props.worldMap.length === 0) {
        // Start with fetching the map content
        fetch(serverURL + "/routes/worldmap.php", DAX.serverMessage({}, true))
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if (data.result !== "success") {
                    console.log("Server responded with error state: ", data);
                    return;
                }
                console.log(data);
                // The data the server sends does not include future-explorable tiles. We need to generate that here
                // Our method will involve running through all existing tiles, and checking the same list to see if there's a neighbor
                // Fortunately, we now have a function for that
                fillMapBorders(data.worldtiles);
                props.setWorldCoords({ x: data.playerx, y: data.playery });
            });

        // While we're waiting for a server response, we should show a loading message on the screen
        // Note that lineHeight of '100%' only works if the text will only be a single line
        return (
            <div style={{ width: "100vh", height: "calc(100vh - 185px)", textAlign: "center", lineHeight: "calc(100vh - 185px)" }}>
                Loading...
            </div>
        );
    }

    return (
        <>
            {/* Show a header bar over-top the map */}
            <div style={{ display: "flex", width: "100%" }}>
                <span className="fakelink" style={{ marginLeft: 20 }} onClick={() => props.setPage("LocalMap")}>
                    Local Map
                </span>
            </div>
            <DraggableMap
                style={{ width: "100vh", height: "calc(100vh - 185px)" }}
                threshhold={5}
                defaultx={-props.worldCoords.x*56 +(window.innerWidth-200)/2}
                defaulty={-props.worldCoords.y*56 +(window.innerHeight-185)/2}
            >
                {props.worldMap.map((tile,key)=>{
                    return (
                        <div
                            key={key}
                            className="worldmaptile"
                            style={{
                                top:tile.y*56,
                                left:tile.x*56,
                                backgroundImage:`url(${imageURL}worldtiles/${worldTileData[tile.biome].img})`,
                                border:'1px solid black'
                            }}
                            onClick={()=>{
                                if(clearDragFlag()) return;
                                setSelectedTile(tile);
                                setCommand('');
                            }}
                        >
                            {tile.x===props.worldCoords.x && tile.y===props.worldCoords.y?(
                                <img src={imageURL +"worldtiles/youarehere.png"} alt="You are Here" style={{pointerEvents:'none', border:0}} draggable="false" />
                            ):tile.isexploring===1?(
                                <img src={imageURL +"worldtiles/exploring.png"} alt="Exploring..." style={{pointerEvents:'none', border:0}} draggable="false" />
                            ):('')}
                        </div>
                    )
                })}
                {/* If a tile is selected, show a details box next to that tile. This won't need the FixedPositionChild tool */}
                {(selectedTile!==null)?(
                    <WorldTileDetail tile={selectedTile} command={command} setCommand={setCommand} exit={()=>setSelectedTile(null)}
                        playerx={props.worldCoords.x} playery={props.worldCoords.y} updateTiles={updateMap} />
                ):('')}
            </DraggableMap>
        </>
    );
}

function WorldTileDetail(props) {
    // Shows details about a selected world tile
    // Prop fields - data
    //      tile - which tile to show the details for
    //      command - what command content to display for this tile
    //      playerx & playery - world coordinates of the player
    // Prop fields - functions
    //      setCommand - Set which command to show on-screen
    //      exit - call this to close the details window
    //      updateTiles - use this to send tile updates

    
    const [units, setUnits] = React.useState(1);

    function countUpdate(f, v) {
        // Updates a specific field from user input. There is only one field to consider, so we won't worry about the fieldname
        setUnits(v);
    }

    function calculateTravelTime(sx, sy, tx, ty) {
        // Determines the total travel time between two tiles
        let distx = Math.abs(sx-tx);
        let disty = Math.abs(sy-ty);
        let diag = Math.max(distx, disty) - Math.abs(distx-disty);
        return (Math.max(distx,disty) - diag) + (diag*1.4);
        // hmm, maybe diag is really not-diagonal?
        // [5,5] to [5,6]; distx=0, disty=1; diag=1; newdiag=0;
        // [5,5] to [6,6]; distx=1, disty=1, diag=0
        // [0,0] to [3,4]; distx=3, disty=4, diag=1
    }

    //function calculatePath()
    
    return (
        <div style={{display:'block', position:'absolute', top:props.tile.y*56, left:props.tile.x*56+57, width:250, zIndex:1, backgroundColor:'white', border:'1px solid black'}} >
            {/* Show an exit button at top right, to close the window */}
            <div style={{display:'block', position:'absolute', top:2, right:2, cursor:'pointer'}} onClick={()=>props.exit()}>
                <img src={imageURL+"exit.png"} />
            </div>
            <p style={{fontWeight:'bold', textAlign:'center'}}>{worldTileData[props.tile.biome].biome}</p>
            <p style={{textAlign:'center'}}>{worldTileData[props.tile.biome].desc}</p>
            {props.command===''?(
                <span className="fakelink" onClick={()=>props.setCommand('send')}>Send Units</span>
            ):(
                <>
                    <p className="singleline" style={{fontWeight:'bold'}}>Send Units</p>
                    <p className="singleline">Number to send:</p>
                    <DanInput onUpdate={countUpdate} fieldname={'unitcount'} default={units} />
                    <p className="singleline">Travel time (1 way): {calculateTravelTime(props.playerx, props.playery, props.tile.x, props.tile.y)*5}:00</p>
                    <p className="singleline">Time at target: 5:00</p>
                    <p className="singleline" style={{fontWeight:'bold'}}>Expected return: {calculateTravelTime(props.playerx, props.playery, props.tile.x, props.tile.y)*10+5}:00</p>
                    <input type="button" value="Send" onClick={()=>{
                        // Send a message to the server to send a unit 
                        fetch(
                            serverURL +'routes/sendunits.php',
                            DAX.serverMessage({people:units, targetx:props.tile.x, targety:props.tile.y, action:'scout'}, true)
                        )  
                            .then(res=>DAX.manageResponseConversion(res))
                            .catch(err => console.log(err))
                            .then(data => {
                                // The server should simply create an event. If successful, it will send info about that event back to the client
                                if(data.result!=='success') {
                                    console.log('Server responded in error:', data);
                                    return;
                                }

                                // We should have received data for a new knownmap tile. Let's update our known map with that now
                                // This... will require feeding all the way back up the chain
                                props.updateTiles([data.tileupdate]);
                            })
                    }}/>
                </>
            )}
        </div>
    )
}