/*  LocalMap.jsx
    Contains the local map component and other related things
    For the game Settlers & Warlords
*/

import React from "react";
import { DraggableMap, clearDragFlag } from "./libs/DraggableMap.jsx";
import { DanInput } from "./libs/DanInput.jsx";

import { imageURL } from "./App.js";
import { minimapTiles } from "./minimapTiles.js";
import { itemStats } from "./itemstats.js";
import { game } from "./game.jsx";

let errorTimeout = null;


export function LocalMap(props) {
    // Displays the local map
    // Prop fields - data
    //      tiles - all tiles of the local map
    //      workers - all workers on this map
    //      mobileMode - set to true or false if the display needs to be managed more
    // Prop fields - functions
    //      onSave - called when the Save button is clicked
    //      onTileUpdate - called when a tile has been updated

    //const [strSelected, setStrSelected] = React.useState(null); // which tile on the right is selected
    const [dragStructure, setDragStructure] = React.useState(null); // This will hold the structure (as 'selected') and the x&y coordinate of the mouse's last location
    const [errorText, setErrorText] = React.useState('');
    const [tileSelected, setTileSelected] = React.useState(null);
    const [tutorialDisplay, setTutorialDisplay] = React.useState(true);
    const [rightPanelDisplay, setRightPanelDisplay] = React.useState(props.mobileMode?false:true);

    // Set the game's tutorialDisplay function while we're here
    game.tutorialDisplay = setTutorialDisplay;

    function ShowError(errorText) {
        setErrorText(errorText);
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(()=>{
            errorTimeout=null;
            setErrorText('');
        }, 8000);
    }

    function onDragStructureDrop(tile) {
        if(dragStructure===null) return;
        if(tile.structureid!==0) {
            ShowError('There is already a building here')
            setDragStructure(null);
            return;
        }
        let reason = dragStructure.selected.canBuild(tile);
        if(reason!=='') {
            // We need to display an error to the user, and then clear it after 8 seconds
            ShowError(reason);
            setDragStructure(null);
            return;
        }

        ShowError('Placed at ['+ tile.x +','+ tile.y +']');
        
        // Now we're ready to actually add the structure
        let structure = dragStructure.selected.create(tile);
        if(typeof(structure)==='undefined') console.log("Error in onDragStructureDrop; are you sure structure.create() returns an object?");
        game.structures.push(structure);
        tile.structureid = structure.id;
        tile.image = structure.image;
        tile.modified = true;
        
        // Look for a Construct task for this building. If one exists, do that task
        let buildTask = structure.tasks.find(task=>task.taskType==='construct');
        if(typeof(buildTask)!=='undefined') {
            game.createTask(structure, buildTask);
        }

        clearDragFlag();
        setDragStructure(null);
        setTileSelected(tile); // also select the tile once the structure is placed
    }

    return (
        <div
            onMouseMove={(event) => {
                if (dragStructure === null) return;
                setDragStructure({...dragStructure, x:event.clientX, y:event.clientY});
            }}
            onTouchMove={(e)=>{
                e.stopPropagation();
                if(e.changedTouches.length > 1) e.preventDefault();
                if(dragStructure===null) return;
                setDragStructure({...dragStructure, x:parseInt(e.touches[0].clientX), y:parseInt(e.touches[0].clientY)});
            }}
            onMouseUp={()=>{
                // If the dragged structure is placed at a random location (triggering this), we want to simply drop it
                if(dragStructure !== null) {
                    setDragStructure(null);
                }
            }}
        >
            {/* Show a header bar over-top the map */}
            <div style={{ display: "flex", width: "100%" }}>
                <span>Biome: {game.localMapBiome}</span>
                <span style={{ marginLeft: 20 }}>Population: 4</span>
                <span className="fakelink" style={{ marginLeft: 20 }} onClick={()=>props.setPage('WorldMap')}>World Map</span>
            </div>
            <div style={{ display: "flex", width: "100%" }}>
                <div style={{ display: "block", width: 150 }}>
                    <div>
                        <span className="fakelink" onClick={() => props.onSave()}>
                            Save
                        </span>
                    </div>
                    {game.structureTypes.filter(str=>str.locked===0).map((str, key) => {
                        return (
                            <div
                                key={key}
                                style={{ display: "inline-block", border: "1px solid black", width: 40, height: 40 }}
                                onMouseDown={(e) => {
                                    setDragStructure({selected:str, x:e.clientX, y:e.clientY})
                                }}
                                onTouchStart={(e)=>{
                                    e.stopPropagation();
                                    if(e.changedTouches.length > 1) e.preventDefault();
                                    setDragStructure({selected:str, x:parseInt(e.touches[0].clientX), y:parseInt(e.touches[0].clientY)});
                                }}
                                onMouseUp={() => {
                                    setDragStructure(null);
                                }}
                                onTouchEnd={(e)=>{
                                    /*e.stopPropagation();
                                    e.preventDefault();
                                    setDragStructure(null);
                                    ShowError('Structure dropped in gutter', e.touches[0]);
                                    console.log(e);*/
                                }}
                            >
                                <img src={imageURL + "structures/" + str.image} alt={str.name} draggable="false" title={str.tooltip} />
                            </div>
                        );
                    })}
                </div>
                {/* removed touchAction:"none" from style */}
                <DraggableMap style={{ width: "100vh", height: "calc(100vh - 185px)"}} threshhold={5}>
                    {props.tiles.map((tile, key) => {
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
                                    onDragStructureDrop(tile);
                                }}
                                onTouchEnd={(e)=>{
                                    console.log('Touch tile!');
                                    //e.preventDefault();
                                    //e.stopPropagation();
                                    onDragStructureDrop(tile);
                                }}
                                onClick={()=>{
                                    // Start by checking the drag flag state. If it returns true, we just finished dragging the map
                                    if(clearDragFlag()) return;
                                    if(game.tutorialModes[game.tutorialState].name==='Welcome') game.advanceTutorial();

                                    setTileSelected(tile);
                                    setRightPanelDisplay(true);
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
                                    <img src={imageURL + "worker.png"} alt="worker" draggable="false" />
                                ): (parseInt(tile.structureid)!==0)? (
                                    <img src={imageURL +"structures/"+ tile.image} alt="Building" style={{pointerEvents:'none', border:0}} draggable="false" />
                                ): (
                                    ''
                                )}
                            </div>
                        );
                    })}
                    {errorText===''?(''):(
                        <div name="FixedPositionChild" style={{display:'block', position:'absolute', backgroundColor:'pink', zIndex:1, padding:5, bottom:0, right:0}}>
                            {errorText}
                        </div>
                    )}
                    {/* Also display the tutorial block. This will always show at least something, but not always the tutorial text */}
                    <div name="FixedPositionChild" style={{display:'block', position:'absolute', backgroundColor:'white', zIndex:2, padding:3, margin:3, top:0, left:0, whiteSpace:'normal'}}>
                        {tutorialDisplay===true?(
                            <>
                                <img src={imageURL +'exit.png'} style={{display:'inline-block', marginRight:5, cursor:'pointer'}}
                                    onClick={()=>{
                                        game.tutorialDisplay = null;
                                        setTutorialDisplay(false);
                                    }} />
                                {game.tutorialModes[game.tutorialState].display}
                            </>
                        ):(
                            <img src={imageURL +"TutorialButton.png"} style={{cursor:'pointer'}} onClick={()=>{
                                game.tutorialDisplay=!game.tutorialDisplay;
                                setTutorialDisplay(!tutorialDisplay);
                            }} />
                        )}
                    </div>
                </DraggableMap>
                {rightPanelDisplay===true?(<LocalMapRightPanel selected={tileSelected} mobileMode={props.mobileMode} onClose={()=>setRightPanelDisplay(false)}/>):('')}
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
    // prop fields - data
    //      selected - which tile is currently selected by the user
    //      mobileMode - true if the display is small. This will trigger the close button to be displayed
    // prop fields - functions
    //      onClose - called when the close button is clicked

    const [blinker,setBlinker] = React.useState(0);
    // Blinker is used to trigger React to re-render this side panel; the setter function is shared with the structure. Since the game
    // updates the structure and not the props, and the user has no interaction to cause updates, this is the only reasonable way to
    // provide updates to the view.
    const [selectedTask, setSelectedTask] = React.useState(null);
    const [quantity, setQuantity] = React.useState(1);

    function quantityUpdate(field,value) {
        // Handles content update from any DanInput objects
        // field - name of the field to edit. This should only be 'quanity', so we can just ignore it
        // value - new value of the quantity
        setQuantity(value);
    }

    function quantitySubmit() { 
        // Handles when the user submits the quantity to craft
        //console.log('Task started with '+ quantity +' to make');
        game.createTask(structure, selectedTask, quantity);
        setQuantity(1);
        setSelectedTask(null);
    }

    if(props.selected===null) {
        // Nothing is selected
        // There's a good chance that this won't ever display, but might as well offer a way to exit that screen
        return (
            <div className="localmaprightpanel" style={{width:300}}>
                {props.mobileMode? (
                    <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()} /></p>
                ):''}
                Click a tile to view its details
            </div>
        );
    }

    let worker = game.workers.find(w=>w.x===props.selected.x && w.y===props.selected.y);

    if(parseInt(props.selected.structureid)===0) {
        // Nothing is built here. Show basic data about it
        //let landType = (props.selected.newlandtype===-1)?props.selected.landtype : props.selected.newlandtype;
        let tileData = minimapTiles.find(e=>e.id===props.selected.landtype);
        if(typeof(tileData)==='undefined') {
            return (
                <div className="localmaprightpanel" style={{width:300}}>
                    {props.mobileMode? (
                        <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()} /></p>
                    ):''}
                    Oops, there's no description for land type where id={props.selected.landtype}
                </div>
            );
        }
        return (
            <div className="localmaprightpanel" style={{width:300}}>
                {props.mobileMode? (
                    <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()} /></p>
                ):''}
                <p>{tileData.desc}</p>
                {/* I'm adding map coordinates here only to help in the debugging process */}
                <p>[{props.selected.x},{props.selected.y}]</p>
                <p className="singleline" style={{fontWeight:'bold'}}>Items:</p>
                <ListItems items={props.selected.items} />
            </div>
        );
    }

    // The default case; this is a tile with a structure on it

    // First see if our structure exists. If not, we should display an error instead of a structure
    const structure = game.structures.find(e=>parseInt(e.id)===parseInt(props.selected.structureid));
    if(typeof(structure)==='undefined') {
        return (
            <div className="localmaprightpanel" style={{width:300, backgroundColor:'pink'}}>
                {props.mobileMode? (
                    <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()} /></p>
                ):''}
                Error: Did not find building id={props.selected.structureid}
            </div>
        );
    }
    
    // Make a list of assignable tasks. If this is empty, we'll show something else
    let validTasks = structure.tasks.filter(t=>t.canAssign());

    // Make a list of active tasks. Structures only store the IDs, so we need to locate each from the game object
    let activeTasks = structure.activeTasks.map(id=>game.tasks.find(t=>t.id===id));

    structure.blinker = setBlinker;
    const SidePanel = structure.SidePanel;
    return (
        <div className="localmaprightpanel" style={{width:300}}>
            {props.mobileMode? (
                <p><img src={imageURL +"exit.png"} alt="eXit" style={{cursor:"pointer"}} onClick={()=>props.onClose()} /></p>
            ):''}
            <div style={{width:'100%', textAlign:'center', fontWeight:'bold'}}>{structure.name}</div>
            <p>{structure.descr}</p>
            <p>{structure.usage}</p>

            <p className="singleline" style={{fontWeight:'bold'}}>Items:</p>
            <ListItems items={props.selected.items} style={{marginBottom:10}} />

            {/* Show the SidePanel content, that shows unique fields for this structure. Not all structure have (or need) a SidePanel function */}
            {(typeof(SidePanel)==='undefined')?'':(<SidePanel />)}
            

            {selectedTask===null? (
                <>
                    {/*Show available tasks that can be assigned*/}
                    <p className="singleline" style={{fontWeight:'bold'}}>Tasks:</p>
                    {validTasks.length>0 ? 
                        validTasks.map((t,key)=>(
                            <p className="singleline fakelink" key={key} title={t.desc} onClick={()=>{
                                if(t.hasQuantity) {
                                    setSelectedTask(t);
                                }else{
                                    // Go ahead and assign this task
                                    game.createTask(structure, t, 1);
                                }
                            }}>
                                {t.name}
                            </p>
                        ))
                    :('None available')}
                </>
            ):(
                <>
                    <p className="singleline" style={{fontWeight:'bold'}}>{selectedTask.name}</p>
                    <p className="singleline">
                        Quantity: <DanInput placeholder="Amount to craft" onUpdate={quantityUpdate} onEnter={quantitySubmit} default={1} fieldName="quantity" />
                    </p>
                    <p className="singleline"><input type="button" value="Start work" onClick={()=>quantitySubmit()} /></p>
                </>
            )}

            {/* Now show existing tasks underway*/}
            <p className="singleline" style={{fontWeight:'bold'}}>Current Tasks:</p>
            {activeTasks.length>0 ?
                activeTasks.map((t,key)=>{
                    if(typeof(t)==='undefined') {
                        // Sometimes tasks are in the list that aren't actually in the list. This happens whenever a task gets completed
                        // and removed... I'm not sure why but it trips up React.
                        return <p className="singleline" key={key}>None</p>;    
                    }
                    let worker = (t.worker===null) ? ', not assigned' : ', by '+ t.worker.name;
                    
                    return (
                        <p className="singleline" key={key}>
                            {t.task.name}{worker}, {Math.floor((t.progress / parseFloat(t.task.buildTime) * 100))}% complete 
                            <input type="button" style={{marginLeft:8}} value="Cancel" onClick={()=>{
                                game.deleteTask(t);
                                setBlinker(100);
                            }}/>
                        </p>
                    );
                })
            :('None')}
        </div>
    );
}

function ListItems(props) {
    // Displays a list of items from a provided list, grouping 
    // prop fields - data
    //      items - array of items to display. This assumes identical items are not grouped together
    //      style - style props will be applied to the container div of this block

    let list = [];
    for(let i=0; i<props.items.length; i++) {
        let slot = list.findIndex(l=>l.name===props.items[i].name);
        if(slot===-1) {
            // Show a picture with this item too, if we have one
            let stats = itemStats.find(stat=>stat.name===props.items[i].name);
            if(typeof(stats)!=='undefined' && stats.img!=='') {
                list.push({name: props.items[i].name, qty: 1, img:stats.img, desc:stats.desc, inTask:props.items[i].inTask});
            }else{
                list.push({name: props.items[i].name, qty: 1, img:'unknown.png', desc:'This item needs a description', inTask:props.items[i].inTask});
            }
        }else{
            list[slot].qty++;
            list[slot].inTask += props.items[i].inTask;
        }
    }

    return (
        <div style={props.style}>
            {list.map((item,key)=>(
                <p className="singleline" key={key} title={item.desc}>
                    <img src={imageURL +"items/"+ item.img} alt={item.name} />
                    {item.name} x{item.qty}, {item.inTask}
                </p>
            ))}
        </div>
    );
}


