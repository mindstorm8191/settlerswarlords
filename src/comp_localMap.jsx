// component - LocalMap.jsx
// Provides an interface for users to interact with the map local to where the player is located
// for the game Settlers & Warlords

import React from "react";
import { imageURL, serverURL, PageChoices } from "./App.js";
import { DAX } from "./DanAjax.js";
import {game} from "./game.jsx";
//import { DanInput } from "./DanInput.jsx";
//import { ErrorOverlay} from "./comp_ErrorOverlay.jsx";

export function localMap_fillFromServerData(mapContent) {
    // Handles a bit of processing for the local map
    // mapContent - data received from the server
    // Returns an updated package of map content

    return mapContent.map(tile => {
        // Right now, we only need to make sure all tiles have a buildid field. Since we get no buildings from the server, this should be simple
        tile.buildid = 0;
        // Also, if the new land type is -1, set it to the default land type
        if(tile.newlandtype===-1) tile.newlandtype = tile.landtype;
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
    const minimapImages = [
        "wheatgrass.png", "oatgrass.png", "ryegrass.png", "barleygrass.png", "milletgrass.png",
        "pinetreetwo.jpg", "basicrock.jpg", "desert.jpg", "smallpond.jpg", "lava.png", "ice.png", "snow.png",
        "emptygrass.jpg", "farmplot.png"
    ];
    const [selected, setSelected] = React.useState(null); // which tile is selected to show details on the right
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

        switch (selected.newlandtype) {
            case 0: return <p>Wheat. Tasteful grains for a variety of uses</p>;
            case 1: return <p>Oat. Hearty grains for many purposes</p>;
            case 2: return <p>Rye. Makes a sour tasting bread</p>;
            case 3: return <p>Barley. A nutty grain</p>;
            case 4: return <p>Millet. It's good for you</p>;
            case 5: return <p>Forest. Best source of wood and other materials</p>;
            case 6: return <p>Barren rock. Easy source of stone materials and building on</p>;
            case 7: return <p>Desert. Hot and hard to build on</p>;
            case 8: return <p>Open water. A vital resource for life</p>;
            case 9: return <p>Hot lava! Very dangerous, even from a distance</p>;
            case 10: return <p>Slick ice. Very cold</p>;
            case 11: return <p>Snowed-over ground. Very cold</p>;
            case 12: return <p>Low-cut grasses. Good for growing things on, or doing other work</p>;
            default: return <p>Land type {props.landId} has not been coded yet</p>;
        }
    }

    function clearIfSelected(buildId) {
        // Clears the selected building, but only if it is currently selected.
        // This is required for the recycler block. I don't know if it'll be needed anywhere else
        if(selected.buildid===buildId) {
            selected.buildid = 0;
            setSelected({...selected});
        }
    }

    function placeBuilding(buildType) {
        // Check that we have a map tile selected, and that there is no building declared here
        if(selected===null) return;
        if(selected.buildid!==0) {
            console.log('There is already building id='+ selected.buildid +' here');
            return;
        }
        let b = buildType.create(selected);
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

    function saveGame() {
        // Saves the game to the server, so that it can be loaded again later
        fetch(serverURL, DAX.serverMessage('savelocalmap', {
            blocks: game.blocks.map(b=>{return {id:b.id, name:b.name, x:b.tileX, y:b.tileY, ...b.save()};}),
            tiles: game.tiles.filter(e=>e.landtype!==e.newlandtype),    // We don't need to send back any tiles that aren't a new land type
            unlockedItems: game.unlockedItems, // This is already a flat list of only strings, so we can pass it as is
            allItems: game.items,
            foodCounter: game.foodCounter,
            population: game.population
            // So far, that's everything
        }, true))
            .then(res=>DAX.manageResponseConversion(res))
            .catch(err=>console.log(err))
            .then(data => {
                console.log('Server responded from save: ', data);
            });
    }

    return (
        <>
            <div style={{display:'flex', width:'100%'}}>
                <div>
                    <span className="haslinespacing">Biome: {props.localStats.biome}</span>
                    <span className="haslinespacing">Idle population: {game.workPoints} / {game.population}</span>
                    <PageChoices selected={"localmap"} onPagePick={props.setPage} />
                </div>
            </div>
            <div style={{display:'flex', width:'100%'}}>
                <div style={{width:180}}>
                    {/* Provide a save button */}
                    <div><button onClick={saveGame}>Save</button></div>
                    {/* Show the various building options the player can put down */}
                    {game.blockTypes.filter(e=>e.unlocked===1).map((btype, key) => (
                        <img key={key} src={imageURL +btype.image} alt={btype.alt} onClick={()=>placeBuilding(btype)}/>
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
                                        backgroundImage: "url(" + imageURL + minimapImages[tile.newlandtype] + ")",
                                        backgroundColor: 'green',
                                        cursor: "pointer",
                                        border: (tile===selected)?'1px solid black':'1px solid green'
                                    }}
                                    key={key}
                                    onClick={() => {
                                        console.log("pickmode="+ game.pickMode);
                                        if(!game.pickMode) return setSelected(tile);  // behave as normal

                                        
                                        // Find the index of the selected block in the game's block list
                                        // We have selected (as a useState variable) that has the hauler object
                                        // We also have tile (defined above) that has the building ID
                                        let haulerSlot = game.blocks.findIndex(e=>e.id===selected.buildid);
                                        if(haulerSlot===-1) return console.log('Error - did not find slot of hauler');
                                        if(game.blocks[haulerSlot].name!=='Hauler') return console.log('Error - working block is not a hauler');
                                        game.blocks[haulerSlot].receiveTarget(tile.buildid);
                                        game.pickMode = false;
                                    }}
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
                        {/*Now, render any 'travellers', where items get transfered between blocks (currently by workers)*/}
                        {game.travellers.map((user, key)=>(
                            <img key={key} src={user.image} alt={'traveller'} style={{position:'absolute', zIndex:4, top:user.y*57, left:user.x*57, pointerEvents:'none'}} />
                        ))}
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
                        <LocalTileBuildingDetail tile={selected} onChangeTile={setSelected} clearIfSelected={clearIfSelected} />
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
    //      clearIfSelected - Allows the current tile to be changed, but only if it matches the building selected. This is used
    //          in the Recycler block, for removing it if it is selected (no action will be taken if it is not)

    
    let block = game.blocks.find(ele=>{
        //console.log('id='+ ele.id);
        return parseInt(ele.id)===parseInt(props.tile.buildid);
    });
    
    // Note that we cannot check this before creating the hooks; React is picky about us changing the number of hooks in a component
    if(typeof(block)==='undefined') return <>Block not found by id={props.tile.buildid}</>;

    const SidePanel = block.SidePanel;  // THIS allows us to render the block's function as a component!
    if(typeof(SidePanel)==='undefined') return <>Block missing SidePanel function (is it named wrong?)</>;

    return <>
        <div style={{width:'100%', textAlign:'center', fontWeight:'bold'}}>{block.name}</div>
        <p>{block.descr}</p>
        <p>{block.usage}</p>
        <SidePanel onChangeTile={props.onChangeTile} clearIfSelected={props.clearIfSelected} />
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
            onClick={props.onClick}
        >
            {props.children}
        </span>
    );
}
