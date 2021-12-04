/*  comp_localMap.js
    Contains the LocalMap component and related other objects
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL, serverURL } from "./App.js";
import { EmptyLandDescription, minimapImages } from "./localTiles.jsx";
import { game } from "./game.js";

export function LocalMap(props) {
    // Manages displaying the local map, where the 'king piece' is located at.

    const [selected, setSelected] = React.useState(null); // which tile is selected to show details on the right
    const [buildSelected, setBuildSelected] = React.useState(null); // which building is selected, or null otherwise
    const [scrollPos, setScrollPos] = React.useState({ moveState: false, x: 0, y: 0 });

    function startPan() {
        setScrollPos({ ...scrollPos, moveState: true });
    }

    function continuePan(e) {
        if (!scrollPos.moveState) return;
        setScrollPos({ moveState: true, x: scrollPos.x + e.movementX, y: scrollPos.y + e.movementY });
    }

    function endPan() {
        setScrollPos({ ...scrollPos, moveState: false });
    }

    function addBuilding(tile) {
        if(buildSelected===null) {
            console.log('Player tried to place building, but no building type was selected');
            return;
        }
        if(tile===null) {
            console.log('Player tried to place a building, but no tile is selected?');
            return;
        }

        let b = buildSelected.create(tile);
        if(typeof b==='string') {
            console.log('Building creation rejected: '+ b);
            return;
        }

        // Add this block to the game's block list
        game.blocks.push(b);

        // Also add this to the given tile. We'll have to update the base tiles to get this to work
        let tileIndex = game.tiles.findIndex(ele=>ele.x===tile.x && ele.y===tile.y);
        game.tiles[tileIndex].buildid = b.id;
        game.tiles[tileIndex].image = b.image;

        // With the game tiles updated, trigger React to update the map
        // For this, we need to provide new instances of the updated tiles - we must provide an array of them. The function will cycle
        // through all the tiles and match based on x & y to swap the tile instances out
        props.onTileUpdate([{...game.tiles[tileIndex], buildid:b.id, buildimage:b.image}]);
        setBuildSelected(null);
    }

    return (
        <>
            <div style={{ display: "flex", width: "100%" }}>
                <div>Area details here</div>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ width: 180 }}>
                    {/*Provide a save button*/}
                    <div>Save</div>
                    {/*List all building options currently available. This is a pseudo list, which we'll use until we have an actual list*/}
                    {game.blockTypes.map((bld, key) => {
                        if(buildSelected!==null) {
                            if(bld.name===buildSelected.name) {
                                return <div key={key} style={{display:'inline', border:'1px solid black'}}><img src={imageURL+bld.img} alt={bld.name} /></div>
                            }
                        }
                        return <img key={key} src={imageURL+bld.img} alt={bld.name} onClick={()=>setBuildSelected(bld)} />;
                    })}
                </div>
                <div id="localmapbox">
                    {/*This is the map container, that lets us scroll the whole map at once*/}
                    <div
                        style={{ position: "absolute", top: scrollPos.y, left: scrollPos.x }}
                        onMouseDown={startPan}
                        onMouseMove={continuePan}
                        onMouseUp={endPan}
                    >
                        {props.localTiles.map((tile, key) => {
                            // For this location, we need to see if we can locate a worker that should be here. If so, we will show this instead
                            // of the normal tile. We could use .find to get the specific worker, but we only really care if there's a worker
                            // here or not; there's no worker-specific display (yet)
                            let hasWorker = props.localWorkers.some(ele => {
                                return parseInt(ele.x)===parseInt(tile.x) && parseInt(ele.y)===parseInt(tile.y)
                            });
                            
                            return (
                                <div
                                    key={key}
                                    style={{
                                        display: "block",
                                        position: "absolute",
                                        width: 40,
                                        height: 40,
                                        top: tile.y * 42,
                                        left: tile.x * 42,
                                        backgroundImage:
                                            "url(" + imageURL + minimapImages[parseInt(tile.newlandtype) === -1 ? tile.landtype : tile.newlandtype] + ")",
                                        cursor: "pointer",
                                        border: tile === selected ? "1px solid black" : "1px solid green",
                                    }}
                                    onClick={()=> {
                                        if(buildSelected!==null) {
                                            addBuilding(tile);
                                            // After creating this building, we can switch to it too
                                        }
                                        setSelected(tile); // We will later have to add management of pickMode here
                                    }}
                                >
                                    {(parseInt(tile.buildid)!==0 && hasWorker===true) ? (
                                        <>
                                            <img src={imageURL +tile.image} alt={"Bldg"} style={{pointerEvents:'none', display:'block', position:'absolute', top:1,left:1}} draggable="false" />
                                            <img src={imageURL +"worker.png"} alt={"worker"} style={{pointerEvents:'none', display:'block', position:'absolute', top:1,left:1,zIndex:1}} draggable="false"/>
                                        </>
                                    ): (hasWorker===true) ? (
                                        <img src={imageURL +"worker.png"} alt="worker" />
                                    ) : parseInt(tile.buildid) === 0 ? (
                                        ""
                                    ) : (
                                        <img src={imageURL +tile.image} alt={"Bldg"} style={{pointerEvents:'none', border:0}} draggable="false" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div id="localmaprightpanel">
                    {buildSelected !== null ? (
                        "Click a map tile to place this building"
                    ) : (selected===null)? (
                        "Click a tile to view options"
                    ) : parseInt(selected.buildid) === 0 ? (
                        <>
                            <EmptyLandDescription tile={selected} />
                            <p className="singleLine">Nothing is built here. Click a block from the left to place it here</p>
                        </>
                    ) : (
                        <LocalMapBuildingDetail bid={selected.buildid}/>
                    )}
                </div>
            </div>
        </>
    );
}

function LocalMapBuildingDetail(props) {
    // Shows content of the selected building on the right panel of the page
    // prop fields - data
    //      bid - ID of the correct building to show

    // Start with verifying input
    if(typeof(props.bid)!=='number') return <>Error: LocalMapBuildingDetail requires bid to be a building ID</>;

    // Find the correct building in the game's blocks list, as that has the actual block content (including the display function)
    const block = game.blocks.find(ele=>parseInt(ele.id) === parseInt(props.bid));
    if(typeof(block)==='undefined') return <>Error: Did not find building ID={props.bid}</>;

    const SidePanel = block.SidePanel;  // This declaration allows us to treat the block's SidePanel function as a fully working React component
    if(typeof(SidePanel)==='undefined') return <>Error: Block missing SidePanel function (type={props.name})</>;

    return <>
        <div style={{width:'100%', textAlign:'center', fontWeight:'bold'}}>{block.name}</div>
        <p>{block.descr}</p>
        <p>{block.usage}</p>
        <SidePanel />
    </>;
}