/*  LocalMap.jsx
    Contains the local map component and other related things
    For the game Settlers & Warlords
*/

import React from "react";
import { DraggableMap } from "./libs/DraggableMap.jsx";

import { imageURL } from "./App.js";
import { minimapTiles } from "./minimapTiles.js";
import { game } from "./game.jsx";

export function LocalMap(props) {
    // Displays the local map
    // Prop fields - functions
    //      onSave - called when the Save button is clicked

    //const [strSelected, setStrSelected] = React.useState(null); // which tile on the right is selected
    const [dragStructure, setDragStructure] = React.useState(null); // This will hold the block and the x&y coordinate of the mouse's last location

    return (
        <div
            onMouseMove={(event) => {
                if (dragStructure === null) return;
                setDragStructure({...dragStructure, x:event.clientX, y:event.clientY});
            }}
            onMouseUp={()=>{
                if(dragStructure !== null) {
                    setDragStructure(null);
                }
            }}
        >
            <div style={{ display: "flex", width: "100%" }}>
                <span>Biome: {game.localMapBiome}</span>
                <span style={{ marginLeft: 20 }}>Population: 4</span>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ display: "block", width: 150 }}>
                    <div>
                        <span className="fakelink" onClick={() => props.onSave()}>
                            Save
                        </span>
                    </div>
                    {game.structureTypes.map((str, key) => {
                        // First, determine if this is the currently selected building
                        let bColor = "black";
                        //if (strSelected !== null && str.name === strSelected.name) bColor = "red";
                        return (
                            <div
                                key={key}
                                style={{ display: "inline-block", border: "2px solid " + bColor, width: 40, height: 40 }}
                                onMouseDown={(e) => {
                                    setDragStructure({selected:str, x:e.clientX, y:e.clientY})
                                }}
                                onMouseUp={() => {
                                    setDragStructure(null);
                                }}
                            >
                                <img src={imageURL + "structures/" + str.image} alt={str.name} draggable="false" />
                            </div>
                        );
                    })}
                </div>
                <DraggableMap
                    style={{ width: "100vh", height: "calc(100vh - 185px)", touchAction: "none" }}
                    threshhold={5}
                    onMouseUp={() => {
                        console.log("placement!");
                    }}
                >
                    {game.tiles.map((tile, key) => {
                        // Determine what tile type to show. When new tiles are added we might not have an image, so that needs
                        // to be checkedfirst.
                        let targetTile = minimapTiles.find((e) => e.id === parseInt(tile.landtype));
                        if (typeof targetTile === "undefined") {
                            targetTile = "snow.png";
                        } else {
                            targetTile = targetTile.img;
                        }

                        // Check if there's a worker here
                        let hasWorker = game.workers.some((wk) => {
                            return parseInt(wk.x) === parseInt(tile.x) && parseInt(wk.y) === parseInt(tile.y);
                        });

                        return (
                            <div
                                key={key}
                                className="localmaptile"
                                style={{
                                    top: tile.y * 42,
                                    left: tile.x * 42,
                                    backgroundImage: `url(${imageURL}localtiles/${targetTile})`,
                                    border: "1px solid grey",
                                }}
                                onMouseUp={(e) => {
                                    //console.log(tile.x + "," + tile.y);
                                    if(dragStructure!==null) {
                                        console.log('Place '+ dragStructure.selected.name +' at '+ tile.x +','+ tile.y +'!');
                                        setDragStructure(null);
                                    }
                                }}
                            >
                                {/* Show contents of this tile. This is a multi-choice result */}
                                {hasWorker === true ? <img src={imageURL + "worker.png"} alt="worker" /> : ""}
                            </div>
                        );
                    })}
                </DraggableMap>
            </div>
            {!(dragStructure===null)?(
                <div style={{display:'block', position:'absolute', top:dragStructure.y-20, left:dragStructure.x-20, width:40, height:40, pointerEvents:'none'}}>
                    <img src={imageURL +"structures/"+ dragStructure.selected.image} alt={dragStructure.selected.name} draggable="false" />
                </div>
            ):('')}
        </div>
    );
}
