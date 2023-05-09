/*  WorldMap.jsx
    Contains the world map and functions related to it
    For the game Settlers & Warlords
*/

import React from "react";
import { DraggableMap, FixedPositionChild, clearDragFlag } from "./libs/DraggableMap.jsx";
import { DanInput } from "./libs/DanInput.jsx";
import { DAX } from "./libs/DanAjax.js";


import { serverURL, imageURL } from "./App.js";

const worldTileData = [
    {id:0, biome:'Grassland', desc:'Large fields of grasses', img:'grass.png'},
    {id:1, biome:'Forest', desc:'Heavy forest growths', img:'forest.png'},
    {id:2, biome:'Desert', desc:'Endless sands with little vegetation', img:'water.png'},
    {id:3, biome:'Swamp', desc:'Wet lands, with water everywhere', img:'swamp.png'},
    {id:4, biome:'Water', desc:'Deep waters', img:'water.png'},
    {id:5, biome:'Jungle', desc:'Rich Jungle, full of life', img:'jungle.png'},
    {id:6, biome:'Frozen Wasteland', desc:'Lands covered in ice and snow', img:'frozen.png'},
    {id:7, biome:'Lavascape',        desc:'Barren rocks with lava puddles everywhere', img:'lava.png'},
    {id:8, biome:'Unexplored',       desc:'Nobody has been here yet', img:'unknown.png'}
]

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
                for (let i = 0; i < data.worldtiles.length; i++) {
                    // The biome of any unexplored tiles will be X. Once we find an unexplored tile in our list, we can exit
                    if (data.worldtiles[i].biome === 8) break;
                    // From this tile, check the surrounding tiles for existing hits
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            let match = data.worldtiles.find((r) => r.x === data.worldtiles[i].x + dx && r.y === data.worldtiles[i].y + dy);
                            if (typeof match === "undefined") {
                                // There is no tile here at all. Let's create one now
                                // Each tile contains the following data: x,y,lastcheck,owner,civ,population,biome
                                data.worldtiles.push({
                                    x: data.worldtiles[i].x + dx,
                                    y: data.worldtiles[i].y + dy,
                                    biome: 8,
                                    lastcheck: "",
                                    owner: 0,
                                    civ: 0,
                                    population: 0,
                                });
                            }
                        }
                    }
                }
                props.setWorldMap(data.worldtiles);
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
    console.log(window);
    return (
        <>
            {/* Show a header bar over-top the map */}
            <div style={{ display: "flex", width: "100%" }}>
                <span className="fakelink" style={{ marginLeft: 20 }} onClick={() => props.setPage("WorldMap")}>
                    World Map
                </span>
            </div>
            <DraggableMap
                style={{ width: "100vh", height: "calc(100vh - 185px)", backgroundColor: "pink" }}
                threshhold={5}
                defaultx={-props.worldCoords.x*56 +(window.innerWidth-200)/2}
                defaulty={-props.worldCoords.y*56 +(window.innerHeight-185)/2}
            >
                {props.worldMap.map((tile,key)=>{
                    return (
                        <div key={key} className="worldmaptile" style={{top:tile.y*56, left:tile.x*56,
                        backgroundImage:`url(${imageURL}worldtiles/${worldTileData[tile.biome].img})`, border:'1px solid black'}}>
                            {tile.x===props.worldCoords.x && tile.y===props.worldCoords.y?(
                                <img src={imageURL +"worldtiles/youarehere.png"} alt="You are Here" style={{pointerEvents:'none', border:0}} draggable="false" />
                            ):('')}
                        </div>
                    )
                })}
            </DraggableMap>
        </>
    );
}