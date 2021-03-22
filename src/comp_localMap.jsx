// component - LocalMap.jsx
// Provides an interface for users to interact with the map local to where the player is located
// for the game Settlers & Warlords

import React from "react";
import { imageURL, PageChoices, buildingList } from "./App.js";
import { LeanTo } from "./block_leanto.jsx";
import { ForagePost } from "./block_foragepost.jsx";
import { RockKnapper } from "./block_rockknapper.jsx";
import { Toolbox } from "./block_toolbox.jsx";
import {game} from "./game.jsx";
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
            case 'leanto': b = LeanTo(selected); break;
            case 'foragepost': b = ForagePost(selected); break;
            case 'rockknapper': b = RockKnapper(selected); break;
            case 'toolbox': b = Toolbox(selected); break;
        }
        if(typeof(b)==='string') {
            console.log('Building placement failed: '+ b);
            return;
        }
        game.blocks.push(b);
        
        // We also need to update the local tiles; updating `selected` won't work here
        let tile = game.tiles.findIndex(ele=>ele.x===selected.x && ele.y===selected.y);
        game.tiles[tile].buildid = b.id;

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
                    {game.blockTypes.filter(e=>e.unlocked==1).map((btype, key) => (
                        <img key={key} src={imageURL +btype.image} alt={btype.alt} onClick={()=>placeBuilding(btype.name)}/>
                    ))}
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
                                            {/* If accessible, show the progress bar */}
                                            {typeof(tile.progressBar)==='undefined'? (''):
                                                <div style={{
                                                    position: 'absolute',
                                                    backgroundColor: tile.progressBarColor,
                                                    zIndex: 3,
                                                    bottom:0,
                                                    height:6,
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
    // prop fields - functions
    //      onTileUpdate - Allows a single map tile to be updated
    
    let block = game.blocks.find(ele=>ele.id===props.tile.buildid);
    if(typeof(block)==='undefined') return <>Block not found by id</>;

    return <>
        <div style={{width:'100%', align:'center'}}>{block.name}</div>
        <p>{block.descr}</p>
        <p>{block.usage}</p>
        {block.SidePanel()}
    </>;
}

export function ClickableLabel(props) {
    // Provides a clickable label with multiple modes that can be swappd at will
    // prop fields - data
    //      mode - which mode to display
    //      options: list of selectable modes, each containing properties:
    //          name: name matching the value of 'mode'
    //          bgColor: Color of the background
    // prop fields - functions
    //      onClick: action to take when the user clicks the box

    // Pick out the correct element. If the element isn't found, pick the last one
    let picked = props.options.find(e=>e.name===props.mode);
    if(typeof(picked)==='undefined') picked = props.options[0];

    return (
        <span
            style={{margin:1, padding:10, backgroundColor:picked.bgColor, cursor:'pointer', border:'1px black solid', display:'inline-block'}}
            onClick={()=>props.onClick(props.mode)}
        >
            {props.children}
        </span>
    );
}
