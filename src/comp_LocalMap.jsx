/*  comp_localMap.js
    Contains the LocalMap component and related other objects
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL, serverURL } from "./App.js";
import { game } from "./game.jsx";
import { DraggableMap } from "./comp_DraggableMap.jsx";


export function LocalMap(props) {
    
    const [selected, setSelected] = React.useState(null); // which tile is selected to show details on the right
    const [buildSelected, setBuildSelected] = React.useState(null); // which building is selected, or null otherwise

    if(props.localTiles===null) {
        // This can happen when the player logs out
        return <div>No map content available</div>;
    }

    function addBuilding(tile) {
        // Handles adding a new building to the map
        // tile - what tile was clicked on when adding a building

        if(buildSelected===null) {
            console.log('Player tried to place building, but no building type was selected');
            return;
        }
        if(tile===null) {
            console.log('PLayer tried to place a building, but no tile is selected?');
            return;
        }

        let b = buildSelected.create(tile);
        if(typeof b ==='string') {
            console.log('Building creation rejected: '+ b);
            return;
        }
        // Add this building to the game's block list
        game.blockList.push(b);

        // Also add this to the given tile. We'll have to update the base tiles to get this to work
        let tileIndex = game.tiles.findIndex(ele=>ele.x===tile.x && ele.y===tile.y);
        game.tiles[tileIndex].buildid = b.id;
        game.tiles[tileIndex].image = b.image;

        // With the game tiles updated, trigger React to update the map
        // For this, we need to provide new instances of the updated tiles. Our function has us provide an array of them.
        // It will replace the whole list with a new one, inserting the updated one in place of the old one.
        props.onTileUpdate([{...game.tiles[tileIndex], buildid:b.id, buildImage:b.image}]);

        // Clear the selected building type while we're here
        setBuildSelected(null);
    }

    return (
        <>
            <div style={{ display: "flex", width: "100%" }}>
                <div>Area details here</div>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ width: 180 }}>
                    {/*Provide a save button (obviously this needs more work, but we'll add it later*/}
                    <div>Save</div>
                    {/*List all building options currently available*/}
                    {game.blockTypes.map((block, key) => {
                        // First, determine if this is the currently selected building
                        let bColor = 'black'; if(buildSelected!==null && block.name===buildSelected.name) bColor = 'red';

                        return (
                            <div key={key} style={{display:'inline-block', border:'1px solid '+ bColor, width:40, height:40}}
                                onClick={()=>{
                                    if(buildSelected==block) {
                                        setBuildSelected(null);
                                    }else{
                                        setBuildSelected(block);
                                    }
                                }}>
                                <img src={imageURL +"structures/"+ block.image} alt={block.name} />
                            </div>
                        );
                    })}
                </div>
                <DraggableMap style={{width:'100%', height:'calc(100vh - 185px)'}}>
                    {props.localTiles.map((tile, key) => {
                        // For each location, we need to determine if a worker is here.
                        let hasWorker = props.localWorkers.some(ele => {
                            return parseInt(ele.x)===parseInt(tile.x) && parseInt(ele.y)===parseInt(tile.y);
                        });

                        // We also need to determine what image to show as the background
                        let targetTile = parseInt(tile.landtype);
                        if(tile.newlandtype!==-1) targetTile = tile.newlandtype;
                        targetTile = minimapTiles.find(e=>e.id===targetTile);
                        if(typeof(targetTile)==='undefined') {
                            targetTile = "snow.png";
                        }else{
                            targetTile = targetTile.img;
                        }
                        
                        return (
                            <div
                                key={key}
                                className="localmaptile"
                                style={{
                                    top: tile.y * 42,
                                    left: tile.x * 42,
                                    backgroundImage: `url(${imageURL}localtiles/${targetTile})`,
                                }}
                                onClick={()=>{
                                    if(buildSelected!==null) {
                                        addBuilding(tile);
                                    }
                                    // Later on, when we have pickMode, we will manage that here. For now, there is only one.
                                    setSelected(tile);
                                }}
                            >
                                {/*Display contents of the tile. This is a multiple-choice result */}
                                {(parseInt(tile.buildid)!==0 && hasWorker===true) ? (
                                    <>
                                        <img src={imageURL +"structures/"+ tile.image} alt="Building" style={{pointerEvents:'none', display:'block', position:'absolute', top:1, left:1,}} draggable="false" />
                                        <img src={imageURL +"worker.png"} alt="Worker" style={{pointerEvents:'none', display:'block', position:'absolute', top:1, left:1}} draggable="false" />
                                    </>
                                ): (hasWorker===true) ? (
                                    <img src={imageURL +"worker.png"} alt="worker" />
                                ): parseInt(tile.buildid)===0 ? (
                                    ""
                                ): (
                                    <img src={imageURL +"structures/"+ tile.image} alt="Building" style={{pointerEvents:'none', border:0}} draggable="false" />
                                )}
                            </div>
                        );
                    })}
                </DraggableMap>
                <div id="localmaprightpanel">
                    {buildSelected !== null ? (
                        "Click a map tile to place this building"
                    ) : (selected===null)? (
                        "Click a tile to view options"
                    ) : parseInt(selected.buildid)===0?(
                        <>
                            <EmptyLandDescription tile={selected} />
                            <p className="singleline">Nothing is built here. Click a block from the left to place it here</p>
                        </>
                    ) : (
                        <LocalMapBuildingDetail bid={selected.buildid} />
                    )}
                </div>
            </div>
        </>
    );
}

function LocalMapBuildingDetail(props) {
    // Shows content of the selected building on the right-side panel
    // prop fields - data
    //      bid - ID of the correct building to show

    // Start with verifying input
    if(typeof(props.bid)!=='number') return <>Error: LocalMapBuildingDetail requires a bid (id of the building), what it received isn't a number</>;

    // get the correct building object from Game
    const block = game.blockList.find(ele=>parseInt(ele.id)===parseInt(props.bid));
    if(typeof(block)==='undefined') return <>Error: Did not find building id={props.bid}</>;
    if(typeof(block.SidePanel)==='undefined') return <>Error: Block missing SidePanel function (type={block.name})</>;

    const SidePanel = block.SidePanel; // This lets us use the block's function as a fully functioning React component. Makes it easy!

    return <>
        <div style={{width:"100%", textAlign:'center', fontWeight:'bold'}}>{block.name}</div>
        <p>{block.descr}</p>
        <p>{block.usage}</p>
        <SidePanel />
    </>
}

function EmptyLandDescription(props) {
    // Provides a basic description of the land in the selected tile
    // Collects the correct land type from the tile that is selected

    // These are the natural land formations
    let landType = (props.tile.newlandtype===-1)?props.tile.landtype:props.tile.newlandtype;

    // We now have all land descriptions in the minimapTiles array. Find the correct one to show
    let tile = minimapTiles.find(e=>e.id===landType);
    if(typeof(tile)==='undefined') {
        // Oops, we didn't find this tile
        return <p>Oops, there's no description for land type where id={landType}</p>;
    }
    return <p>{tile.desc}</p>;
}

export const minimapTiles = [
    {id:0, img:'wheatgrass.png', desc: 'Wheat. Tasteful grains for a variety of uses', walkLag: 6},
    {id:1, img:'oatgrass.png',     desc: 'Oat. Hearty grains for many purposes',         walkLag: 6},
    {id:2, img:'ryegrass.png',     desc: 'Rye. Makes a sour tasting bread', walkLag: 6},
    {id:3, img:'barleygrass.png',  desc: 'Barley. A nutty grain',                       walkLag: 6},
    {id:4, img:'milletgrass.png',  desc: 'Millet. Its good for you',                    walkLag: 8},
    {id:5, img:'mapletreeone.jpg', desc: 'Maple trees. Its sap is useful for syrups',  walkLag: 8},
    {id:6, img:'mapletreeone.jpg', desc: 'Birch trees. Its bark is good for making ropes', walkLag: 8},
    {id: 7, img:'mapletreeone.jpg', desc: 'Oak trees. Provides acorns - edible in a pinch', walkLag: 8},
    {id: 8, img:'mapletreeone.jpg',  desc: 'Mahogany trees. Provides lots of shade',                                      walkLag: 8},
    {id: 9, img:'pinetreetwo.jpg',   desc: 'Pine trees. Green year-round, and provides pinecones',                        walkLag: 8},
    {id:10, img:'pinetreetwo.jpg',   desc: 'Cedar trees. Grows tall and straight',                                        walkLag: 8},
    {id:11, img:'pinetreetwo.jpg',   desc: 'Fir trees. Strong trees that make lots of sticks',                            walkLag: 8},
    {id:12, img:'pinetreetwo.jpg',   desc: 'Hemlock trees. Grows tall in tight clusters',                                 walkLag: 8},
    {id:13, img:'cherrytreeone.jpg', desc: 'Cherry trees. Makes a tart fruit, good for many dishes',                      walkLag: 8},
    {id:14, img:'appletreeone.jpg',  desc: 'Apple trees. Delicious fruits that everyone enjoys',                          walkLag: 8},
    {id:15, img:'peartreeone.jpg',   desc: 'Pear trees. Tasty fruits that excel in colder climates',                      walkLag: 8},
    {id:16, img:'orangetreeone.jpg', desc: 'Orange trees. Sweet fruits that enjoy warmer climates',                       walkLag: 8},
    {id:17, img:'mapletreeone.jpg',  desc: 'Hawthorne trees. It seems to pulse with extra energy',                        walkLag: 8},
    {id:18, img:'mapletreeone.jpg',  desc: "Dogwood trees. You wouldn't think this would grow here, but it's determined", walkLag: 8},
    {id:19, img:'mapletreeone.jpg',  desc: 'Locust trees. It seems to have an extra glow in the sunlight',                walkLag: 8},
    {id:20, img:'pinetreeone.jpg',   desc: 'Juniper trees. It seems to come alive at night',                              walkLag: 8},
    {id:21, img:'basicrock.jpg',     desc: 'Barren rock. Easy source of stone materials and building on',                 walkLag: 5},
    {id:22, img:'desert.jpg',        desc: 'Desert sands. Hot, dusty and hard to build on',                               walkLag: 6},
    {id:23, img:'smallpond.jpg',     desc: 'Sitting water. Lots of life grows in it, but drinking it makes you sick',     walkLag: 25},
    {id:24, img:'lava.png',          desc: 'Hot lava! Very dangerous, even from a distance',                              walkLag: 50},
    {id:25, img:'ice.png',           desc: 'Slick ice. Very cold',                                                        walkLag: 10},
    {id:26, img:'snow.png',          desc: 'Snowed-over ground. Very cold',                                               walkLag: 14},
    {id:27, img:'smallpond.jpg',     desc: 'Flowing water through a stream',                                              walkLag: 25},
    {id:28, img:'emptygrass.jpg',    desc: 'Wet grounds. Some grass, mostly water',                                       walkLag: 20},
    {id:29, img:'basicrock.jpg',     desc: "Rugged cliff. Don't get close to the edge",                                   walkLag: 80},
    {id:30, img:'smallpond.jpg',     desc: 'Creek-side rubble. Lots of tiny rocks that the stream washed in',             walkLag: 15},
    {id:31, img:'basicrock.jpg',     desc: 'Creek bank. The streams are slowly eroding this wall',                        walkLag: 20},
    {id:32, img:'emptygrass.jpg',    desc: 'Short grass space. Nothing major here, good for new projects',                walkLag: 6},
    {id:33, img:'farmplot.png',      desc: 'Active farm space.',                                                          walkLag: 12},
    {id:34, img:'basicdirt.jpg',     desc: 'Open dirt pit. Too much foot traffic for plants to grow here',                walkLag: 6},
    {id:35, img:'basicrock.jpg',     desc: "Flat gravel surface. Won't turn into a muddy mess in the rain",               walkLag: 4}
];
