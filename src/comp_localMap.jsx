/*  comp_localMap.js
    Contains the LocalMap component and related other objects
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL, serverURL, game } from "./App.js";
import { EmptyLandDescription, minimapImages } from "./localTiles.jsx";

const blockTypes = [
    {name:"Lean-To", img:"leanto.png", create:LeanTo}
];

function LeanTo() {
    // Returns an object that will manage activities for a new Lean-To

    let b = {
        id: 1,
        name: 'Lean To',
        descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
        for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
        on top, this is fast & easy to set up, but wont last long in the elements itself.`,
        usage: `Needs workers to set this up, then can be used for a time before it must be rebuilt`,
        image: "leanto.png",
        mode: 'build',
        counter: 0,
        SidePanel: ()=>{
            // Displays text for this building, when selected, on the right panel of the page
            return <p>Hello dudes!</p>;
        },
        update: () => {
            if(b.mode==='use') {
                b.counter--;
                if(b.counter<=0) b.mode='build';
            }else{
                console.log(b.counter);
            }
        },
        openTasks: () => {
            // Returns a list of all current task names that this block needs done. The worker will then decide if they wish to complete
            // that task. If so, assignTask must be called with that task.
            // If there are no tasks, an empty array will be returned.
            if(b.mode==='use') return [];
            return ['construct']; // Task names are defined from a fixed list
        }
    };
    return b;
}

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
        game.blockList.push(b);

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
                    {blockTypes.map((bld, key) => {
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
                                    {(hasWorker===true) ? (
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

    // Find the correct building in the game's blockList, as that has the actual block content (including the display function)
    const block = game.blockList.find(ele=>parseInt(ele.id) === parseInt(props.bid));
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