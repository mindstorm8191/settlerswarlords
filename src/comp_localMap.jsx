// component - LocalMap.jsx
// Provides an interface for users to interact with the map local to where the player is located
// for the game Settlers & Warlords

import React from "react";
import { imageURL, PageChoices, buildingList, gameLocalTiles } from "./App.js";
import { DanCommon } from "./DanCommon.js";
//import { DAX } from "./DanAjax.js";
//import { serverURL, imageURL, PageChoices, buildingList, gameLocalTiles } from "./App.js";
//import { DanInput } from "./DanInput.jsx";
//import { ErrorOverlay} from "./comp_ErrorOverlay.jsx";

export function localMap_fillFromServerData(mapContent) {
    // Handles a bit of processing for the local map
    // mapContent - data received from the server
    // Returns an updated package of map content

    return mapContent.map(tile => {
        // Right now, we only need to make sure all tiles have a buildid field. Since we get no buildings from the server, this should be simple
        tile.buildid = 0;
        return tile;
    });
}

export function LocalMap(props) {
    // Handles displaying local map content, along with buildings and their options on the right side
    // prop fields - data
    //      localTiles - All tiles of the local map
    //      localStats - Additional information about this local map
    // prop fields - functions
    //      setPage      - handles changing the selected page. Only passed to TabPicker
    //      onTileUpdate - handles any map tiles that have been updated

    // minimap images could be global later, but for now we only need them here
    const minimapImages = ["emptygrass.jpg", "pinetreetwo.jpg", "basicrock.jpg", "desert.jpg", "smallpond.jpg", "basicrock.jpg", "basicore.jpg"];
    const [selected, setSelected] = React.useState(null); // which square is selected to show details on the right
    const [scrollPos, setScrollPos] = React.useState({moveState:false,x:0,y:0});

    function startPan() {
        setScrollPos({...scrollPos, moveState:true});
    }

    function continuePan(e) {
        if(!scrollPos.moveState) return;
        setScrollPos({moveState:true, x:scrollPos.x+e.movementX, y:scrollPos.y+e.movementY});
    }

    function endPan() {
        setScrollPos({...scrollPos, moveState:false});
    }

    function EmptyLandDescription() {
        // Provides a basic description of the land on this selected tile
        // landType - ID of the land type. This should be provided by props.landType

        switch (selected.landtype) {
            case 0: return <p>Grassland. Excellent for new construction and farming</p>;
            case 1: return <p>Forest. Best source of wood and other materials</p>;
            case 2: return <p>Barren rock. Easy source of stone materials and building on</p>;
            case 3: return <p>Desert. Hot and hard to build on</p>;
            case 4: return <p>Open water. A vital resource for life</p>;
            case 5: return <p>Hot lava! Very dangerous, even from a distance</p>;
            case 6: return <p>Slick ice. Very cold</p>;
            case 7: return <p>Snowed-over ground. Very cold</p>;
            default: return <p>Land type {props.landId} has not been coded yet</p>;
        }
    }

    function placeBuilding(buildingName) {
        // Check that we have a map tile selected, and that there is no building declared here
        if(selected===null) return;
        if(selected.buildid!==0) {
            console.log('There is already building id='+ selected.buildid +' here');
            return;
        }
        let b = {};

        switch(buildingName) {
            case 'leanto':
                // Let's start by creating our object first
                b = {
                    id: (buildingList.length===0)?1:buildingList[buildingList.length-1].id+1,
                        // We can pick a unique ID by looking at the last building, and going +1 of that - as long as the list isn't empty
                        // This will only work until we prioritize buildings (to use work points correctly)
                    name: 'Lean-To',
                    descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                            for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                            on top, this is fast & easy to set up, but wont last long in the elements itself.`,
                    usage: `Needs time to set up, then can be used for a time before it must be rebuilt`,
                    image: imageURL+'leanto.png',
                    mode: 'building',
                    progressBar: 0,
                    progressBarMax: 120,
                    progressBarColor: 'brown',
                    tileX: selected.x,
                    tileY: selected.y,
                    update: () => {
                        if(b.mode==='building') {
                            b.progressBar++;
                            if(b.progressBar>=120) {
                                b.mode = 'in use';
                                b.progressBar = 300;
                                b.progressBarMax = 300;
                                b.progressBarColor = 'black';
                            }
                        }else{
                            b.progressBar--;
                            if(b.progressBar<=0) {
                                b.mode = 'building';
                                b.progressBar = 0;
                                b.progressBarMax = 120;
                                b.progressBarColor = 'brown';
                            }
                        }
                    },
                    sidePanel: ()=>{
                        return (
                            <>
                                <div>Mode: {b.mode}</div>
                                <div>Counter: {b.progressBar}</div>
                            </>
                        );
                    }
                }
            break;
            case 'foragepost':
                // Check that there are no other forage posts in this area
                if(buildingList.some(e=>e.name==="Forage Post")) {
                    console.log('There is already a forage post in this area');
                    return;
                }
                b = {
                    id: (buildingList.length===0)?1:buildingList[buildingList.length-1].id+1,
                    name: "Forage Post",
                    descr: `All around you is a world teeming with life - and food. It is there for the taking, you just have to find it first.`,
                    usage: `Collects edible foods from the surrounding environment.  Local supplies can only support up to 4 workers. Cannot place
                            another one in this area`,
                    image: imageURL+'foragepost.png',
                    progressBar: 0,
                    progressBarColor: 'orange',
                    progressBarMax: 30,
                    tileX: selected.x,
                    tileY: selected.y,
                    onhand: [],
                    update: ()=>{
                        b.progressBar++;
                        if(b.progressBar>=30) {
                            b.onhand.push(DanCommon.getRandomFrom('Apple', 'Berries', 'Tree Nuts', 'Mushrooms'));
                            b.progressBar = 0;
                        }
                    },
                    sidePanel: ()=>{
                        return <>
                            <div>Progress: {parseInt((b.progressBar*100)/30)}%</div>
                            <div>Food on hand: {b.onhand.length}</div>
                        </>;
                    }
                }
            break;
        }
        buildingList.push(b);
        
        // We also need to update the local tiles
        let tile = gameLocalTiles.find(ele=>ele.x===selected.x && ele.y===selected.y);
        tile.buildid = b.id;

        // Update the specific tile. We already have a function to help us do that; it accepts any number of updated tiles,
        // swapping out any based on X&Y coordinates
        props.onTileUpdate([{...selected, buildid:b.id, buildimage:b.image}]);
    }

    return (
        <>
            <div style={{display:'flex', width:'100%'}}>
                <div>
                    <span className="haslinespacing">Biome: {props.localStats.biome}</span>
                    <span className="haslinespacing">Population: {props.localStats.population}</span>
                    <PageChoices selected={"localmap"} onPagePick={props.setPage} />
                </div>
            </div>
            <div style={{display:'flex', width:'100%'}}>
                <div style={{width:180}}>
                    <img src={imageURL +'leanto.png'} alt="leanto" onClick={()=>placeBuilding('leanto')}/>
                    <img src={imageURL +'foragepost.png'} alt="forage post" onClick={()=>placeBuilding('foragepost')}/>
                    <img src={imageURL +'rockKnapper.png'} alt="rock knapper"/>
                    <img src={imageURL +'toolbox.png'} alt="toolbox"/>
                </div>
                <div id="localmapbox">
                    {/* This is the map container, that helps us scroll the whole map at once */}
                    <div
                        style={{position:'absolute', top:scrollPos.y, left:scrollPos.x}}
                        onMouseDown={startPan}
                        onMouseMove={continuePan}
                        onMouseUp={endPan}
                    >
                        {props.localTiles.map((tile, key) => {
                            let hasConstruction=0;
                            
                            return (
                                <div
                                    style={{
                                        display: "block",
                                        position: "absolute",
                                        width: 55,
                                        height: 55,
                                        top: tile.y * 57,
                                        left: tile.x * 57,
                                        backgroundImage: "url(" + imageURL + minimapImages[tile.landtype] + ")",
                                        backgroundColor: 'green',
                                        cursor: "pointer",
                                        border: (tile===selected)?'1px solid black':'1px solid green'
                                    }}
                                    key={key}
                                    onClick={() => setSelected(tile)}
                                >
                                    {parseInt(tile.buildid) === 0 ? (
                                        ""
                                    ) : (
                                        <>
                                            <img src={tile.buildimage} alt={"building"} style={{ pointerEvents: "none", border:0 }} draggable="false"/>
                                            {typeof(tile.progressBar)==='undefined'? (''):
                                                <div style={{
                                                    backgroundColor: tile.progressBarColor,
                                                    bottom:0,
                                                    height:20,
                                                    width:tile.progressBar
                                                }}></div>
                                            }
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div id="localmaprightpane">
                    {selected === null ? (
                        "Click a tile to view options"
                    ) : parseInt(selected.buildid) === 0 ? (
                        <>
                            {EmptyLandDescription()}
                            <p className="singleline">Nothing is built here. Select a block from the left to place it here</p>
                        </>
                    ) : (
                        <LocalTileBuildingDetail tile={selected} />
                    )}
                </div>
            </div>
        </>
    );
}

function LocalTileBuildingDetail(props) {
    // Shows cnotent on the right about the selected building.
    // Components that use this component: LocalMap
    // prop fields - data
    //     tile - object containing all the data about the building to show
    
    let block = buildingList.find(ele=>ele.id===props.tile.buildid);
    if(typeof(block)==='undefined') return <>Block not found by id</>;

    return <>
        <div style={{width:'100%', align:'center'}}>{block.name}</div>
        <p>{block.descr}</p>
        <p>{block.usage}</p>
        {block.sidePanel()}
    </>;
}

