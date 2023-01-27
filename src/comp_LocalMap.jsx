/*  comp_localMap.js
    Contains the LocalMap component and related other objects
    For the game Settlers & Warlords
*/

import React from "react";
import { imageURL, debuggingEnabled } from "./App.js";
import { game } from "./game.jsx";
import { DraggableMap, clearDragFlag, FixedPositionChild } from "./libs/DraggableMap.jsx";
import { DanCommon } from "./libs/DanCommon.js";
import { DanInput } from "./libs/DanInput.jsx";

export function LocalMap(props) {
    // Displays the local map, along with everything connected to it
    // prop fields - data
    //      stats - general info about this map of land
    //      localTiles - list of all tiles of the map
    //      localWorkers - list of all workers (and its data) on this map
    //      mobileMode - This is set to true when the screen is too small to properly show the map and side panels too
    // prop fields - functions
    //      onTileUpdate - This is called when the contents of a tile changes (such as when a building is placed)
    //      onSave - Called when the save button is clicked
    
    const [selected, setSelected] = React.useState(null); // which tile is selected to show details on the right
    const [buildSelected, setBuildSelected] = React.useState(null); // which building is selected, or null otherwise

    //const [mobileLeftPane, setMobileLeftPane] = React.useState(false); // This is set to true when the left pane is taking the full screen
    const [mobileRightPane, setMobileRightPane] = React.useState(props.mobileMode?false:true); // Same for the right pane
    const [tutorialDisplay, setTutorialDisplay] = React.useState(true);
    // Pass the funciton for this into the Game object, so it can be called whenever the tutorial state changes
    game.tutorialDisplay = setTutorialDisplay;

    const [mapClickAction, setMapClickAction] = React.useState(null);

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
            console.log('Player tried to place a building, but no tile is selected?');
            return;
        }

        if(buildSelected.primary && tile.buildid!==0) {
            console.log('Player cant place building here, theres already something here');
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
        game.tiles[tileIndex].modified = true;

        // Next, see if there is a construct task. If so, it will be generated (and left unassigned)
        let buildTask = b.tasks.find(t=>t.taskType==='construct');
        if(typeof(buildTask)!=='undefined') {
            buildTask.create(); // This pushes the new task to game.tasks already
        }

        // With the game tiles updated, trigger React to update the map
        // For this, we need to provide new instances of the updated tiles. Our function has us provide an array of them.
        // It will replace the whole list with a new one, inserting the updated one in place of the old one.
        props.onTileUpdate([{...game.tiles[tileIndex], buildid:b.id, }]);

        // Clear the selected building type while we're here
        setBuildSelected(null);
    }

    return (
        <>
            <div style={{ display: "flex", width: "100%" }}>
                <div>
                    <span>Biome: {props.stats.biome}</span>
                    <span style={{marginLeft:20}}>Population: {game.workers.length}</span>
                </div>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ display:'block', width: props.mobileMode?60:150 }}>
                    {/*Provide a save button (obviously this needs more work, but we'll add it later*/}
                    <div className="fakelink" onClick={()=>props.onSave()}>Save</div>
                    {/*List all building options currently available*/}
                    {game.blockTypes.filter(block=>block.locked===0).map((block, key) => {
                        // First, determine if this is the currently selected building
                        let bColor = 'black';
                        if(block.featuresUnlocked) bColor = 'green';
                        if(buildSelected!==null && block.name===buildSelected.name) bColor = 'red';

                        return (
                            <div key={key} style={{display:'inline-block', border:'2px solid '+ bColor, width:40, height:40}}
                                onClick={()=>{
                                    block.featuresUnlocked = false; // Do this when a block is selected
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
                <DraggableMap style={{width:'100vh', height:'calc(100vh - 185px)', touchAction:'none'}} threshhold={5}>
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

                        let borderColor = 'grey';
                        if(mapClickAction!==null) {
                            if(mapClickAction.validTiles(tile)) {
                                borderColor = 'green';
                            }else{
                                borderColor = 'red';
                            }
                        }
                        
                        return (
                            <div
                                key={key}
                                className="localmaptile"
                                style={{
                                    top: tile.y * 42,
                                    left: tile.x * 42,
                                    backgroundImage: `url(${imageURL}localtiles/${targetTile})`,
                                    border: '1px solid '+ borderColor
                                }}
                                onClick={()=>{
                                    if(clearDragFlag()) return;

                                    if(mapClickAction!==null) {
                                        mapClickAction.onValidClick(tile);
                                        return;
                                    }

                                    if(buildSelected!==null) {
                                        addBuilding(tile);
                                    }
                                    // Later on, when we have pickMode, we will manage that here. For now, there is only one.
                                    setSelected(tile);
                                    setMobileRightPane(true);

                                    // Find out if this tile has a building on it. If so, we need to clear its featuresUnlocked flag
                                    if(tile.buildid!==0) {
                                        // get name of the building type here
                                        let bName = game.blockList[game.blockList.findIndex(b=>b.id===tile.buildid)].name;
                                        game.blockTypes[game.blockTypes.findIndex(t=>t.name===bName)].featuresUnlocked = false;
                                    }
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
                    <FixedPositionChild>
                        <div style={{display:'block', position:'absolute', backgroundColor:'white', zIndex:1, padding:3, margin:3, whiteSpace:'normal'}} >
                            {tutorialDisplay===true?(
                                <>
                                    <img
                                        src={imageURL +"exit.png"}
                                        style={{display:'inline-block', marginRight:5, cursor:'pointer'}}
                                        onClick={()=>{
                                            game.tutorialDisplay=!game.tutorialDisplay;
                                            setTutorialDisplay(!tutorialDisplay);
                                        }}
                                    />
                                    {game.tutorialModes[game.tutorialState].display}
                                </>
                            ):(
                                <img src={imageURL +"TutorialButton.png"} style={{cursor:'pointer'}} onClick={()=>{
                                    game.tutorialDisplay=!game.tutorialDisplay;
                                    setTutorialDisplay(!tutorialDisplay);
                                }} />
                            )}
                        </div>
                    </FixedPositionChild>
                </DraggableMap>
                {/* Show the tutorial section. We want this to render over top of the main map */}

                {mobileRightPane?(
                    <LocalMapRightPanel mobileMode={props.mobileMode} selected={selected} buildSelected={buildSelected} onClose={()=>setMobileRightPane(false)} setMapClickAction={setMapClickAction} />
                ):('')}
            </div>
        </>
    );
}

function LocalMapRightPanel(props) {
    // Handles displaying (or keeping it hidden) the right-side panel
    // props - data
    //      mobileMode: set to true if we are working with a small display
    //      selected: which tile of the local map is selected
    //      buildSelected: which structure on the left is selected
    // props - functions
    //      onClose - called when the close button is pressed. This does not manage whether the side panel is displayed or not
    //      setMapClickAction - sets a function to be called when the user clicks a tile on the map

    const [hideState, setHideState] = React.useState(props.mobileMode?true:false);

    // Actual output will depend wildly on what state we're in
    if(props.buildSelected !== null) {
        // User has selected a new structure to place, from the left.
        return (
            <div id="localmaprightpanel" style={{width:props.mobileMode?150:300}}>
                {props.mobileMode? (
                    <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()}/></p>
                ):''}
                Click a map tile to place this building
            </div>
        );
    }
    if(props.selected === null) {
        // No tiles are selected - at all. This is the beginning state of viewing maps
        return (
            <div id="localmaprightpanel" style={{width:props.mobileMode?150:300}}>
                {props.mobileMode? (
                    <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()}/></p>
                ):''}
                Click a map tile to view information
            </div>
        );
    }

    // Also see if there is a worker here
    let worker = game.workers.find(w=>w.x===props.selected.x && w.y===props.selected.y);

    if(parseInt(props.selected.buildid)===0) {
        // The tile selected has no development on it

        return (
            <div id="localmaprightpanel" style={{width:props.mobileMode?150:300}}>
                {props.mobileMode? (
                    <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()}/></p>
                ):''}
                <EmptyLandDescription tile={props.selected} />
                <p>Nothing is built here. Click a block from the left to place it here</p>
                {typeof(worker)==='undefined'?'':(
                    <>
                        <p style={{fontWeight:'bold'}} className="singleline">
                            {worker.name}, {worker.status}
                            {debuggingEnabled?(<span className="fakelink" style={{marginLeft:3}} onClick={()=>console.log(worker)}>Debug</span>):('')}
                        </p>
                    </>
                )}
            </div>
        );
    }

    // The default case!
    return (
        <div id="localmaprightpanel" style={{width:props.mobileMode?150:300}}>
            {props.mobileMode? (
                <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()}/></p>
            ):''}
            <LocalMapBuildingDetail bid={props.selected.buildid} setMapClickAction={props.setMapClickAction}/>
            {typeof(worker)==='undefined'?'':(
                <>
                    <p style={{fontWeight:'bold'}} className="singleline">{worker.name}, {worker.status}</p>
                </>
            )}
        </div>
    );
}

function LocalMapBuildingDetail(props) {
    // Shows content of the selected building on the right-side panel
    // prop fields - data
    //      bid - ID of the correct building to show
    // prop fields - functions
    //      setMapClickAction - sets a function to be called whenever the user clicks a tile on the map

    const [selectedTask, setSelectedTask] = React.useState(null);
    //const [selectedWorker, setSelectedWorker] = React.useState(null);
    const [workerAction, setWorkerAction] = React.useState('');
    const [blink,setBlink] = React.useState(0);
    const [makeCount,setMakeCount] = React.useState(1);
    const [countSet,setCountSet] = React.useState(false); // true if user has confirmed the amount to produce


    // Start with verifying input
    if(typeof(props.bid)!=='number') return <>Error: LocalMapBuildingDetail requires a bid (id of the building), what it received isn't a number</>;

    // get the correct building object from Game
    const block = game.blockList.find(ele=>parseInt(ele.id)===parseInt(props.bid));
    if(typeof(block)==='undefined') return <div style={{backgroundColor:'pink'}}>Error: Did not find building id={props.bid}</div>;
    if(typeof(block.SidePanel)==='undefined') return <div style={{backgroundColor:'pink'}}>Error: Block missing SidePanel function (type={block.name})</div>;
    block.blinker = setBlink;

    const SidePanel = block.SidePanel; // This lets us use the block's function as a fully functioning React component. Makes it easy!

    return <>
        <div style={{width:"100%", textAlign:'center', fontWeight:'bold'}}>{block.name}</div>
        <p>{block.descr}</p>
        <p>{block.usage}</p>
        <SidePanel />
        {/* Now show the tasks this building offers. If one is selected, we will show details of that one only. */}
        {(selectedTask===null)?(
            <>
                {(block.tasks.filter(t=>t.canAssign())).length>0?(
                    <>
                        <p className="singleline" style={{fontWeight:'bold'}}>Available Tasks:</p>
                        {block.tasks.filter(t=>t.canAssign()).map((t,key)=>(
                            <p
                                className="singleline fakelink"
                                key={key}
                                onClick={()=>{
                                    // no quantity, no location pick: task ready to complete
                                    // has quantity, no location pick: ask for quantity
                                    // no quantity, has location pick: ask for location
                                    // has quantity, has location pick: ask for both
                                    if(t.hasQuantity || t.userPicksLocation) {
                                        setSelectedTask(t);
                                    }
                                    if(!t.hasQuantity) {
                                        if(!t.userPicksLocation) {
                                            // We should be good to simply create this task & go
                                            t.create();
                                            setBlink(-1);
                                        }else{
                                            setSelectedTask(t);
                                            setCountSet(true);
                                        }
                                    }
                                    
                                }}
                            >{t.name}</p>
                        ))}
                    </>
                ):( 
                    <p className="singleline" style={{fontWeight:'bold'}}>No available tasks</p>
                )}
            </>
        ):(!countSet)?(
            <>
                # to craft:
                <DanInput
                    placeholder={"enter quantity"}
                    default={1}
                    onUpdate={(a,b)=>setMakeCount(b)}
                />
                <span className="fakelink" style={{backgroundColor:'grey', padding:3}} onClick={()=>{
                    if(selectedTask.userPicksLocation) {
                        setCountSet(true);
                        props.setMapClickAction({onValidClick: (tile)=>{
                            // before proceeding, check if this tile is valid, since users can click any tile
                            if(!selectedTask.validLocations(tile)) return;

                            // This is where we handle the response from the user's click
                            let rask = selectedTask.create();
                            rask.targetx = tile.x;
                            rask.targety = tile.y;

                            // Now clear all the display settings
                            setCountSet(false);
                            setSelectedTask(null);
                            props.setMapClickAction(null);
                        }, validTiles: selectedTask.validLocations});
                    }else{
                        let task = selectedTask.create();
                        task.quantity = makeCount;
                        setSelectedTask(null);
                    }
                }}>{selectedTask.userPicksLocation?'Continue':'Start'}</span>
                or
                <span className="fakelink" style={{padding:3}} onClick={()=>{
                    // Cancel to go back
                    setSelectedTask(null);
                }}>Cancel</span>
            </>
        ):(
            <>
                <p className="singleline">
                    Select a location on the map to perform this, or
                    <span
                        className="fakelink"
                        style={{marginLeft:3}}
                        onClick={()=>{
                        //    selectedWorker.addTask(block,selectedTask.name,workerAction,makeCount);
                        //    setSelectedWorker(null);
                            let task = selectedTask.create();
                            // well, since we don't have a place for this to function at, there isn't really anything to add to it

                            // We also need to clear all settings when the user does this
                            setSelectedTask(null);
                            setCountSet(false);
                            props.setMapClickAction(null);
                        }}>
                        let the worker decide
                    </span>
                </p>
                <p
                    className="singleline fakelink"
                    onClick={()=>{
                        props.setMapClickAction(null);
                        setCountSet(false);
                    }}
                >Cancel</p>
            </>
        )}

        {/* Show any active tasks, and their progress. This will show under the available tasks, no matter what state it's in */}
        {block.activeTasks.map((task,key)=>{
            if(typeof(task.task)==='undefined' || task.task===null) {
                console.log('Error in task: missing task instance', task);
            }
            return (
                <p className="singleline" key={key}>
                    Task {task.task.name},
                    {(task.worker===null)?'Task not assigned':'by '+ task.worker.name +", "+ Math.floor((parseFloat(task.progress)/parseInt(task.ticksToComplete))*100) +"% complete"}

                    {/*
                        (task.worker===null)?(<>Task not assigned</>):(<>Task assigned</>)
                    /*(
                        <>
                            Task {task.task.name}, by {task.worker.name}, 
                            {" "+ Math.floor((parseFloat(task.progress)/parseInt(task.progressTarget))*100)}% complete
                            <input type="button" value="Cancel" onClick={()=>{
                                // Clearing the task from the worker will handle updating the task's structure
                                task.worker.clearTask();
                                setBlink(blink+1);
                            }} />
                        </>
                    )*/}
                </p>
            );
        })}
    </>
}

function WorkersByAvailability(props) {
    // Lists all workers available, ordered by availability
    //  prop fields - data
    //      showActivity - set to true to show the current activity of a worker
    //  prop fields - functions
    //      onPick - called when a user clicks on a worker

    // We will need to generate multiple lists for this; that is why we need this component
    // Splitting this into 3 lists isn't as straight-forward as it might seem. We'll need a generic function for this
    let workList = DanCommon.arraySplit(game.workers, worker=>{
        // Uhh, wait. I don't even know how to determine worker types, until I have tasks assigned. So everyone's idle - for now
        return worker.status;
    });
    return (
        <>
            {typeof(workList.idle)==='undefined'?'':(
                workList.idle.map((worker,key)=>(
                    <p className="singleline fakelink" key={key}>
                        {worker.name} (idle)
                        <button style={{marginLeft:8}} onClick={()=>props.onPick(worker, 'assign')}>Assign</button>
                    </p>
                ))
            )}
            {typeof(workList.aiding)==='undefined'?'':(
                workList.aiding.map((worker,key)=>(<p className="singleline fakelink" key={key}>{worker.name} (aiding)</p>))
            )}
            {typeof(workList.working)==='undefined'?'':(
                workList.working.map((worker,key)=>(
                    <p className="singleline fakelink" key={key}>
                        {worker.name} (working)
                        <button style={{marginLeft:8}} onClick={()=>props.onPick(worker, 'first')} title={"Pause current task and complete this instead"}>Do First</button>
                        <button style={{marginLeft:8}} onClick={()=>props.onPick(worker, 'queue')} title={"Start this task after all current tasks are completes"}>Do Last</button>
                        <button style={{marginLeft:8}} onClick={()=>props.onPick(worker, 'reassign')} title={"Cancel all current tasks and do this instead"}>Do Instead</button>
                    </p>
                ))
            )}
        </>
    );
}

function EmptyLandDescription(props) {
    // Provides a basic description of the land in the selected tile
    // Collects the correct land type from the tile that is selected

    // These are the natural land formations
    let landType = (props.tile.newlandtype===-1)?props.tile.landtype:props.tile.newlandtype;

    // We now have all land descriptions in the minimapTiles array. Find the correct one to show
    let tileData = minimapTiles.find(e=>e.id===landType);
    if(typeof(tileData)==='undefined') {
        // Oops, we didn't find this tile
        return <p>Oops, there's no description for land type where id={landType}</p>;
    }
    return (
        <>
            <p>{tileData.desc}</p>
            {game.groupItems(props.tile.items).map((item,key)=>(
                <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
            ))}
        </>
    );
}

export const minimapTiles = [
    {id:0, img:'wheatgrass.png', desc: 'Wheat. Tasteful grains for a variety of uses', walkLag: 6},
    {id:1, img:'oatgrass.png',     desc: 'Oat. Hearty grains for many purposes',         walkLag: 6},
    {id:2, img:'ryegrass.png',     desc: 'Rye. Makes a sour tasting bread', walkLag: 6},
    {id:3, img:'barleygrass.png',  desc: 'Barley. A nutty grain',                       walkLag: 6},
    {id:4, img:'milletgrass.png',  desc: 'Millet. Its good for you',                    walkLag: 8},
    {id:5, img:'mapletreeone.jpg', desc: 'Maple trees. Its sap is useful for syrups',  walkLag: 8},
    {id:6, img:'mapletreeone.jpg', desc: 'Birch trees. Its bark is good for making ropes', walkLag: 8},
    {id: 7, img:'mapletreeone.jpg', desc: 'Oak trees. Provides acorns - edible in a pinch',                               walkLag: 8},
    {id: 8, img:'mapletreeone.jpg',  desc: 'Mahogany trees. Provides lots of shade',                                      walkLag: 8},
    {id: 9, img:'pinetreetwo.jpg',   desc: 'Pine trees. Green year-round, and provides pinecones',                        walkLag: 8},
    {id:10, img:'pinetreetwo.jpg',   desc: 'Cedar trees. Grows tall and straight',                                        walkLag: 8},
    {id:11, img:'pinetreetwo.jpg',   desc: 'Fir trees. Strong trees that make lots of sticks',                            walkLag: 8},
    {id:12, img:'pinetreetwo.jpg',   desc: 'Hemlock trees. Grows tall in tight clusters',                                 walkLag: 8},
    {id:13, img:'cherrytreeone.jpg', desc: 'Cherry trees. Makes a tart fruit, good for many dishes',                      walkLag: 8},
    {id:14, img:'appletreeone.jpg',  desc: 'Apple trees. Delicious fruits that everyone enjoys',                          walkLag: 8},
    {id:15, img:'peartreeone.jpg',   desc: 'Pear trees. Tasty fruits that excel in colder climates',                      walkLag: 8},
    {id:16, img:'orangetreeone.jpg', desc: 'Orange trees. Sweet fruits that enjoy warmer climates',                       walkLag: 8},
    {id:17, img:'mapletreeone.jpg',  desc: 'Hawthorn trees. It seems to pulse with extra energy',                         walkLag: 30}, // this tree has thorns
    {id:18, img:'mapletreeone.jpg',  desc: "Dogwood trees. You wouldn't think this could grow here, but it's determined", walkLag: 8},
    {id:19, img:'mapletreeone.jpg',  desc: 'Locust trees. It seems to have an extra glow in the sunlight',                walkLag: 30}, // this also has thorns
    {id:20, img:'pinetreeone.jpg',   desc: 'Juniper trees. It seems to come alive at night',                              walkLag: 8},
    {id:21, img:'basicrock.jpg',     desc: 'Barren rock. Easy source of stone materials and building on',                 walkLag: 5},
    {id:22, img:'desert.jpg',        desc: 'Desert sands. Hot, dusty and hard to build on',                               walkLag: 6},
    {id:23, img:'smallpond.jpg',     desc: 'Sitting water. Lots of life grows in it, but drinking it makes you sick',     walkLag: 25},
    {id:24, img:'lava.png',          desc: 'Hot lava! Very dangerous, even from a distance',                              walkLag: 50},
    {id:25, img:'ice.png',           desc: 'Slick ice. Very cold',                                                        walkLag: 10},
    {id:26, img:'snow.png',          desc: 'Snowed-over ground. Very cold',                                               walkLag: 14},
    {id:27, img:'smallpond.jpg',     desc: 'Flowing water through a stream',                                              walkLag: 25},
    {id:28, img:'emptygrass.jpg',    desc: 'Wet grounds. Some grass, mostly water',                                       walkLag: 20},
    {id:29, img:'basicrock.jpg',     desc: "Rugged cliff. Don't get too close to the edge",                               walkLag: 80},
    {id:30, img:'smallpond.jpg',     desc: 'Creek-side rubble. Lots of tiny rocks that the stream washed in',             walkLag: 15},
    {id:31, img:'basicrock.jpg',     desc: 'Creek bank. The streams are slowly eroding this wall',                        walkLag: 20},
    {id:32, img:'wildcarrot.jpg',    desc: 'Wild carrots. An excellent vegetable',                                        walkLag: 8},
    {id:33, img:'wildpotato.jpg',    desc: 'Wild potatoes. A very filling vegetable',                                     walkLag: 8},
    {id:34, img:'wildtomato.png',    desc: 'Wild tomatoes. Useful for many cooking recipes',                              walkLag: 8},
    {id:35, img:'wildturnip.png',    desc: 'Wild turnips. A nutritious vegetable',                                        walkLag: 8},
    {id:36, img:'wildpeanut.png',    desc: 'Wild peanuts. A tasty snack',                                                 walkLag: 8},
    {id:37, img:'wildmaize.png',     desc: 'Wild Maize - also known as corn. Has many uses',                              walkLag: 8},
    {id:38, img:'wilbean.png',       desc: 'Wild beans. A very filling vegetable',                                        walkLag: 8},
    {id:39, img:'wildonion.png',     desc: 'Wild onion. A sharp taste on its own, but great with other foods',            walkLag: 8},
    {id:40, img:'wildbroccoli.png',  desc: 'Wild broccoli. A good vegetable',                                             walkLag: 8},
    {id:41, img:'wildpumpkin.png',   desc: 'Wild pumpkin.',                                                               walkLag: 8},
    {id:32, img:'emptygrass.jpg',    desc: 'Short grass space. Nothing major here, good for new projects',                walkLag: 6},
    {id:33, img:'farmplot.png',      desc: 'Active farm space.',                                                          walkLag: 12},
    {id:34, img:'basicdirt.jpg',     desc: 'Open dirt pit. Too much foot traffic for plants to grow here',                walkLag: 6},
    {id:35, img:'basicrock.jpg',     desc: "Flat gravel surface. Won't turn into a muddy mess in the rain",               walkLag: 4}
];
