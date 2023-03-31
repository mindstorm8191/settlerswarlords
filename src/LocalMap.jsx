/*  LocalMap.jsx
    Contains the local map component and other related things
    For the game Settlers & Warlords
*/

import React from "react";
import { DraggableMap, FixedPositionChild, clearDragFlag } from "./libs/DraggableMap.jsx";

import { imageURL } from "./App.js";
import { minimapTiles } from "./minimapTiles.js";
import { game } from "./game.jsx";

let errorTimeout = null;

export function LocalMap(props) {
    // Displays the local map
    // Prop fields - data
    //      tiles - all tiles of the local map
    //      workers - all workers on this map
    // Prop fields - functions
    //      onSave - called when the Save button is clicked
    //      onTileUpdate - called when a tile has been updated

    //const [strSelected, setStrSelected] = React.useState(null); // which tile on the right is selected
    const [dragStructure, setDragStructure] = React.useState(null); // This will hold the structure (as 'selected') and the x&y coordinate of the mouse's last location
    const [errorText, setErrorText] = React.useState('');
    const [tileSelected, setTileSelected] = React.useState(null);

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
                        return (
                            <div
                                key={key}
                                style={{ display: "inline-block", border: "1px solid black", width: 40, height: 40 }}
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
                <DraggableMap style={{ width: "100vh", height: "calc(100vh - 185px)", touchAction: "none" }} threshhold={5}>
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
                        let hasWorker = props.workers.some((wk) => {
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
                                    // Handle dragging & dropping new structures this way. When an image is dropped here, we will only
                                    // recieve a mouseUp event.
                                    if(dragStructure===null) return;
                                    if(tile.structureid!==0) {
                                        setErrorText('There is already a building here');
                                        clearTimeout(errorTimeout);
                                        errorTimeout = setTimeout(()=>{
                                            errorTimeout=null;
                                            setErrorText('');
                                        }, 8000);
                                        setDragStructure(null);
                                        return;
                                    }
                                    let reason = dragStructure.selected.canBuild(tile);
                                    if(reason!=='') {
                                        // We need to display an error to the user, and then clear it after 8 seconds
                                        setErrorText(reason);
                                        clearTimeout(errorTimeout);
                                        errorTimeout = setTimeout(()=>{
                                            errorTimeout=null;
                                            setErrorText('');
                                        }, 8000);
                                        setDragStructure(null);
                                        return;
                                    }
                                    
                                    // Now we're ready to actually add the structure
                                    let structure = dragStructure.selected.create(tile);
                                    game.structures.push(structure);
                                    tile.structureid = structure.id;
                                    tile.image = structure.image;
                                    tile.modified = true;
                                    
                                    // Look for a Construct task for this building
                                    let buildTask = structure.tasks.find(task=>task.taskType==='construct');
                                    if(typeof(buildTask)!=='undefined') {
                                        //console.log(game.createTask(structure, buildTask));
                                    }

                                    setDragStructure(null);
                                    setTileSelected(tile); // also select the tile once the structure is placed
                                }}
                                onClick={()=>{
                                    // Start by checking the drag flag state. If it returns true, we just finished dragging the map
                                    if(clearDragFlag()) return;

                                    setTileSelected(tile);
                                }}
                            >
                                {/* Show contents of this tile. This is a multi-choice result */}
                                {(parseInt(tile.structureid)!==0 && hasWorker===true) ? (
                                    <>
                                        <img
                                            src={imageURL +"structures/"+ tile.image}
                                            alt="Building"
                                            style={{pointerEvents:'none', display:'block', position:'aboslute', top:1, left:1}}
                                            draggable="false"
                                        />
                                        <img
                                            src={imageURL+ "worker.png"}
                                            alt="Worker"
                                            style={{pointerEvents:'none', display:'block', position:'absolute', top:1, left:1}}
                                            draggable="false"
                                        />
                                    </>
                                ): (hasWorker===true) ?  (
                                    <img src={imageURL + "worker.png"} alt="worker" />
                                ): (parseInt(tile.structureid)!==0)? (
                                    <img src={imageURL +"structures/"+ tile.image} alt="Building" style={{pointerEvents:'none', border:0}} draggable="false" />
                                ): (
                                    ''
                                )}
                            </div>
                        );
                    })}
                    {errorText===''?(''):(
                        <FixedPositionChild>
                            <div style={{display:'block', position:'absolute', backgroundColor:'pink', zIndex:1, padding:5, bottom:0, right:0}}>
                                {errorText}
                            </div>
                        </FixedPositionChild>
                    )}
                </DraggableMap>
                <LocalMapRightPanel selected={tileSelected} />
            </div>
            {!(dragStructure===null)?(
                <div style={{display:'block', position:'absolute', top:dragStructure.y-20, left:dragStructure.x-20, width:40, height:40, pointerEvents:'none'}}>
                    <img src={imageURL +"structures/"+ dragStructure.selected.image} alt={dragStructure.selected.name} draggable="false" />
                </div>
            ):('')}
        </div>
    );
}

function LocalMapRightPanel(props) {
    // Manages displaying the right panel of the local map, with whatever is needed to be shown there

    if(props.selected===null) {
        // Nothing is selected
        return <div className="localmaprightpanel">Click a tile to view its details</div>;
    }

    let worker = game.workers.find(w=>w.x===props.selected.x && w.y===props.selected.y);

    if(parseInt(props.selected.structureid)===0) {
        // Nothing is built here. Show basic data about it
        //<div id="localmaprightpanel">
        let landType = (props.selected.newlandtype===-1)?props.selected.landtype : props.selected.newlandtype;
        let tileData = minimapTiles.find(e=>e.id===landType);
        if(typeof(tileData)==='undefined') {
            return <div className="localmaprightpanel">Oops, there's no description for land type where id={landType}</div>;
        }
        return <div className="localmaprightpanel"><p>{tileData.desc}</p></div>;
    }

    // The default case; this is a tile with a structure on it
    const structure = game.structures.find(e=>parseInt(e.id)===parseInt(props.selected.structureid));
    if(typeof(structure)==='undefined') {
        return <div className="localmaprightpanel" style={{width:300, backgroundColor:'pink'}}>Error: Did not find building id={props.selected.structureid}</div>;
    }
    if(typeof(structure.SidePanel)==='undefined') {
        return <div className="localmaprightpanel" style={{width:300, backgroundColor:'pink'}}>Error: Block (type={structure.name}) missing SidePanel function</div>;
    }

    const SidePanel = structure.SidePanel;

    //return <div className="localmaprightpanel">There's something here...</div>;
    return (
        <div className="localmaprightpanel" style={{width:300}}>
            <div style={{width:'100%', textAlign:'center', fontWeight:'bold'}}>{structure.name}</div>
            <p>{structure.descr}</p>
            <p>{structure.usage}</p>
            <SidePanel />
        </div>
    );
}
