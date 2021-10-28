/*
    comp_worldMap.jsx
    Contains React components and other objects related to the world map
    For the game Settlers & Warlords
*/

import React from "react";

import { DAX } from "./DanAjax.js";
import { DanCommon } from "./DanCommon.js";
import { DanInput } from "./DanInput.jsx";

import { serverURL, imageURL, PageChoices } from "./App.js";

const worldMapTile = [
    { biome: 0, name: "Grassland", image: "worldgrass.png", desc: "Open fields of grass. A ripe place to grow crops" },
    { biome: 1, name: "Forest", image: "worldforest.png", desc: "Tall trees and dense brush. An excellent source of lumber" },
    { biome: 2, name: "Desert", image: "worlddesert.png", desc: "Hot and dusty lands. Resources are scarce, but land is cheap" },
    { biome: 3, name: "Swamp", image: "worldswamp.png", desc: "Wet marsh and lakes. Structures are unstable, travel is difficult" },
    { biome: 4, name: "Water", image: "worldwater.png", desc: "Water as far as can be seen. Many things exist under the surf" },
    { biome: 5, name: "Jungle", image: "worldjungle.png", desc: "Tall trees in hot and humid lands. Life is plentiful but hostile" },
    { biome: 6, name: "Lavascape", image: "worldlava.png", desc: "Lava and rock, too hot for anything. Not a good place to be!" },
    { biome: 7, name: "Frozen Waste", image: "worldfrozen.png", desc: "Snow and ice, nothing but cold. Not a good place to be!" },
    { biome: 8, name: "Exploring", image: "worldexploring.png", desc: "Travellers have been sent to see what's there" },
    { biome: 9, name: "Unexplored Land", image: "worldunseen.png", desc: "Nothing is known of this area" },
];

// A simple array containing cardinal directions, for additional uses
export const cardinalDirections = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
];

function manDist(x1, y1, x2, y2) {
    // Returns a manhattan distance between two points. This is useful in a cardinal-direction map, and is faster
    // than calculating a bee-line distance
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

export function worldMap_fillFromServerData(data, userId) {
    // Manages filling in the world map data that is received from the server. THe server will supply all the real tiles, but unexplored
    // tiles need to be displayed as well. This adds those as existing tiles, even though they aren't real
    // data - data package that is received from the server
    // Returns a new instance of the world map structure. This can be passed to the React hook

    // Mark any lands as conquerable or not. Players can only conquer lands that are adjacent to their own land
    // (firstly; there may be more requirements later)
    // While here, also set colors of certain tiles, based on which player owns them. The map tiles will be in the order of discovery,
    // making the player's own lands first (and therefore, blue)
    const tileColorList = ['blue','orange','green','brown','slate','white','red','black','yellow','violet','rose','aqua'];
    let foundOwners = [];
    data.worldmap = data.worldmap.map(ele => {
        ele.canConquer = cardinalDirections.some(adjust => {
            // Find the tile for this adjusted location
            let neighbor = data.worldmap.find(inner =>
                (parseInt(ele.x)+adjust.x === parseInt(inner.x) && parseInt(ele.y)+adjust.y === parseInt(inner.y)));
            if(neighbor==null) return false;
            console.log('compare '+ neighbor.owner +' vs '+ userId);
            return neighbor.owner===userId;
        });

        if(ele.owner!=0) {
            let slot = foundOwners.findIndex(red=>red===ele.owner);
            if(slot===-1) {
                // This is a new listing. Push a new owner ID to the list
                foundOwners.push(ele.owner);
                ele.tileColor = tileColorList[(foundOwners.length-1)%12];
            }else{
                ele.tileColor = tileColorList[slot%12];
            }
        }
        return ele;
    });

    let addons = data.worldmap.map(ele => {
        // if this is a 'pending exploration' tile, we don't need to 'explode' it
        if(ele.biome===worldMapTile.length-2) {
            return undefined;
        }
        return cardinalDirections.map(adjust => {
            // Determine if any of the adjacent world map blocks exist
            if(data.worldmap.some(inner => (parseInt(ele.x)+adjust.x === parseInt(inner.x) && parseInt(ele.y)+adjust.y === parseInt(inner.y)))) {
                // There is already a tile here. Return undefined. We can remove this later
                return undefined;
            }
            // Since there's no tile here, create one
            return {
                x: parseInt(ele.x)+adjust.x,
                y: parseInt(ele.y)+adjust.y,
                biome: worldMapTile[worldMapTile.length-1].biome,
                civ:-1,
                owner:0,
                canConquer:false
            };
        });
    });
    // That creates a 2D array, but we need to flatten it
    addons = DanCommon.flatten(addons).filter(check => {
        // Remove any results that came back as undefined
        // We would have done this earlier, but need to also remove tiles we won't search around (because they're actively being explored)
        return check !== undefined;
    });

    // We still have to remove duplicates from our addons list. Converting this to a set & back only works for primitives. We will use a
    // different method
    let filtered = [];
    addons.forEach(ele => {
        if(!filtered.some(find => ele.x===find.x && ele.y===find.y)) {
            filtered.push(ele);
        }
    });

    // Now we have all the new tiles we need. Return it with the existing tiles
    return [...data.worldmap, ...filtered];
}

export function WorldMap(props) {
    // Handles displaying the world, as the user understands it
    // prop fields - data
    //      worldMap - list of objects, each is information about a world map tile
    //      specifics - object holding specific details: current player coordinates, and user's ID (to compare against a tile's owner)
    //      localItems - list of all items (with quantities) of what is available at the player's current location
    // prop fields - functions
    //      setPage - Allows the user to switch which page they are looking at
    //      changeWorldMap - React updater function to update the contents of the world map
    //      startWorldAction - called when the user chooses to send units to another world map tile. Parameters
    //          x, y - world coordinates to send the units to
    //          action - what action to take for that land
    //          travellers - how many units are heading there

    const [pickedTile, setPickedTile] = React.useState(null);
    const [scrollPos, setScrollPos] = React.useState({moveState:false,x:0,y:0});
    //console.log(props.worldMap);

    function changeMapTile(newTile) {
        // Allows a single world map tile to be inserted into the existing world map
        props.changeWorldMap(props.worldMap.map(ele => {
            if(ele.x===newTile.x && ele.y===newTile.y) {
                return newTile;
            }
            return ele;
        }));
    }

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

    // blue orange green brown slate white red black yellow violet rose aqua

    return (
        <div
            style={{
                width: "100%",
                height: window.innerHeight - 170,
                position: "relative",
                overflow: "hidden",
            }}>
            <div style={{position:'relative', zIndex:'1', backgroundColor:'white'}}>
                <PageChoices selected={"worldmap"} onPagePick={props.setPage} />
            </div>
            
            {/* Now to display the map */}
            <div
                style={{width:"100%", height:window.innerHeight-170, position:'relative', left:scrollPos.x, top:scrollPos.y}}
                onMouseDown={startPan}
                onMouseMove={continuePan}
                onMouseUp={endPan}
                >
                {props.worldMap.map((ele, key) => (
                    <div
                        key={key}
                        className="worldmaptile"
                        
                        style={{
                            top: (ele.y - props.specifics.cury) * 55 + (window.innerHeight - 170) / 2,
                            left: (ele.x - props.specifics.curx) * 55 + window.innerWidth / 2,
                            border: (ele.owner===0?'0px':'1px solid '+ ele.tileColor)
                        }}
                    >
                        <img
                            draggable="false" // this can only be applied to the image tag, nothing else
                            src={imageURL + worldMapTile[ele.biome].image}
                            onClick={() => {
                                setPickedTile(ele);
                            }}
                            alt="land"
                            onMouseDown={startPan}
                            onMouseMove={continuePan}
                            onMouseUp={endPan}
                        />
                        {ele.x === props.specifics.curx && ele.y === props.specifics.cury ? (
                            <img
                                className="worldmaptileimageoverlay"
                                src={imageURL + "youarehere.png"}
                                alt="you are here"
                            />
                        ) : 
                            // Show the civilization type on top, if one exists here
                            ele.civ===-1?(''):ele.civ.image===''?(''):(
                                <img
                                    className="worldmaptileimageoverlay"
                                    src={imageURL+ele.civ.image}
                                    alt={ele.civ.name}
                                />
                            )
                        }
                    </div>
                ))}
                {/* Now, show the selected tile, if any is picked */}
                {pickedTile === null ? (
                    ""
                ) : (
                    <WorldTileDetail
                        tile={pickedTile}
                        curDetails={props.specifics}
                        onClose={() => setPickedTile(null)}
                        changeMapTile={changeMapTile}
                        localItems={props.localItems}
                    />
                )}
            </div>
        </div>
    );
}

function WorldTileDetail(props) {
    // Displays detailed information about a specific world map tile selected
    // prop fields - data
    //      tile - details about the selected tile
    //      curDetails - Information about the place that the user is currently at
    //      localItems - List of all items at the player's current location
    // prop fields - functions
    //      onClose - action to take when the X button for closing the pop-up window is clicked
    //      changeMapTile - Allows a single map tile to be replaced, triggering a full React re-render

    const [action, setAction] = React.useState(""); // The selected action to show details on

    // When another tile is selected, update the interface
    React.useEffect(()=> {
        return ()=>{ setAction(""); };
    }, [props.tile]);

    function showOptions() {
        // Shows user actions based on the type of land selected

        if(props.tile.biome===worldMapTile[worldMapTile.length-1].biome) {
            // This area is not explored yet. Allow the area to be explored
            return (
                <>
                    <p className={"singleline"}>You must explore a land first</p>
                    <p className={"fakelink singleline"} onClick={()=>setAction('expedition')}>Send Expedition</p>
                </>
            );
        }
        if(props.tile.biome===worldMapTile[worldMapTile.length-2].biome) {
            // The user is already exploring this area
            return <p>We will decide what to do when they have returned</p>;
        }
        if(props.tile.civ===-1 && props.tile.owner===0 && props.tile.canConquer) {
            // Nobody owns this land. Allow the player to conquer it
            console.log(props.tile.canConquer);
            return (
                <>
                    <p className="singleline">Nobody owns this land.</p>
                    <p className="singleline fakelink" onClick={()=>setAction('settle')}>Settle lands</p>
                    <p className="singleline fakelink" onClick={()=>setAction('gather')}>Gather resources</p>
                </>
            );
        }
        return <p className="singleline">This needs coded</p>;
    }

    function startWorldAction(travellers, itemsList, startActions) {
        // Handles setting up a world action to take place
        // travellers - number of colony units being sent. Minimum is 1
        // itemsList - array of all items being taken on this journey
        // startActions - object with properties specific to settling new lands. So far we only have forage:t/f or leantos:t/f
        // The world coordinates for this action is determined by props.tile
        // The action used is determined by the React state named action

        if(props.tile===null) {
            console.log('Error - called startWorldAction() while props.tile is not set. No action taken');
            return;
        }
        let pkg = { x: props.tile.x, y: props.tile.y, command: action, members: travellers, items:itemsList };
        if(action==='settle') {
            pkg.forage = startActions.forage?'true':'false';
            pkg.leantos = startActions.leantos?'true':'false';
        }
        fetch(serverURL, DAX.serverMessage("startworldaction", pkg, true))
            .then((res) => DAX.manageResponseConversion(res))
            .catch((err) => console.log(err))
            .then((data) => {
                if(data.result!=='success') {
                    console.log('Server reported error:', data);
                    return;
                }
                // While we should have received a tag to determine when to fetch data from the server again, our main concern now is
                // to update the selected tile on the map
                let working = props.tile;
                working.biome = worldMapTile.length-2;
                props.changeMapTile(working);
                props.onClose();
            });
    }

    return (
        <div className="worldmaptiledetailbox"
            style={{
                top: (1+props.tile.y - props.curDetails.cury) * 55 + (window.innerHeight - 170) / 2,
                left: (props.tile.x - props.curDetails.curx) * 55 + window.innerWidth / 2,
            }}
        >
            {/* Start with the X close button at the top right */}
            <img className="exitbutton" src={imageURL + "exit.png"} onClick={props.onClose} alt={"eXit"} />

            {/* Show some basic data of this land, including inhabitants */}
            <div style={{textAlign: 'center'}}>
                {props.tile.civ===-1?(
                    <div>
                        <p className="singleline" style={{fontWeight:'bold'}}>
                            {worldMapTile[props.tile.biome].name}
                        </p>
                        <p>{worldMapTile[props.tile.biome].desc}</p>
                    </div>
                ):(
                    <div>
                        <p className="singleline" style={{fontWeight:'bold'}}>
                            {props.tile.civ.name}
                        </p>
                        <p>{props.tile.civ.desc}</p>
                    </div>
                )}
            </div>

            {/* Show some actions the user can do with this land */}
            {action === "" ? (
                showOptions()
            ) : (
                <WorldActionDetail
                    choice={action}
                    distance={manDist(props.tile.x, props.tile.y, props.curDetails.curx, props.curDetails.cury)}
                    startWorldAction={startWorldAction}
                    localItems={props.localItems}
                />
            )}
        </div>
    );
}

function WorldActionDetail(props) {
    // Displays details about the selected action on the world map.
    // prop fields - data
    //      choice - which action they chose to view details of
    //      distance - distance from the current location this is
    //      localItems - list of all items the player currently has at this location
    // prop fields - functions
    //      startWorldAction - called when the user chooses to start the selected action. parameters:
    //          1 (required): number of colonists being used for this action
    //          2 (required): List of items the colonists will take with them. This will include at least some amount of food, selected by the user
    //          3 (required): List of properties to include, exclusive to settling new lands. So far we only have forage:t/f and leantos:t/f

    const [numTravellers, setNumTravellers] = React.useState(props.choice==='settle'?4:1);
    const [pickedItems, setPickedItems] = React.useState([]);
    const [itemChoices, setItemChoices] = React.useState([]);
    const [startActions, setStartActions] = React.useState({forage:false, leantos:false});

    //console.log(props.localItems);

    function capacity() {
        // Calculates the remaining capacity of the party. This is used more than once
        let carrying = pickedItems.reduce((carry,ele)=>{
            // Add special cases for carrying items, such as satchels. This may make our number negative, but it's not a problem
            if(ele.name==='Satchel') return carry-ele.amount*20;

            return carry+ele.amount
        },0);
        return numTravellers*3-carrying
    }

    function addItem(newItem) {
        // If there's nothing in the list, create the first element
        if(pickedItems.length===0) {
            setPickedItems([{name:newItem.name, amount:1, isFood:newItem.isFood}]);
            return;
        }
        // First, determine if this item is in the list already
        let slot = pickedItems.findIndex(e=>e.name===newItem.name);
        let list = pickedItems;
        if(slot===-1) {
            list.push({name:newItem.name, amount:1, isFood:newItem.isFood});
        }else{
            list[slot].amount++;
        }
        setPickedItems(list);
    }

    function foodNeeded() {
        // Returns how much food is needed for the trip. This is used more than once
        if(props.choice==='settle') {
            return props.distance * numTravellers;
        }
        return props.distance * 2 * numTravellers;
    }

    function foodItems() {
        // Returns the total food that has been selected for this journey
        // Since we happen to have isFood stored as 0 or 1, we can just add it up!
        let result = pickedItems.reduce((carry,item)=>{ return carry+item.isFood*item.amount;},0);
        console.log(result);
        return result;
    }

    function displayPrompt() {
        // Shows the correct prompt, based on what action was selected (in props)
        switch(props.choice) {
            case 'expedition': return <p>Send people to explore new lands, and determine its inhabitants</p>;
            case 'settle':     return <p>Settle a land to expand your kingdom</p>;
            case 'gather':     return <p>Send people to gather resources at remote locations</p>;
        }
    }
    
    // Generally, it will take 5 minutes to walk between each world tile
    // Food is also consumed at a rate of 1 every 5 minutes, per colonist
    return (
        <div>
            {displayPrompt()}
            <p className="singleline">
                Distance: {props.distance}
                <span style={{ marginLeft: 30 }}></span>
                Time to return: {props.distance * 10} minutes
            </p>
            <p className="singleline">
                <DanInput placeholder="travellers - min 1" onUpdate={(f, v) => setNumTravellers(v)} default={numTravellers} />
            </p>
            <span style={{fontWeight:'bold'}}>Load</span> (capacity {capacity()})
            {pickedItems.map((ele,key) => (
                <div key={key}>
                    {ele.name} x {ele.amount +" "}
                    <span style={{fontWeight:'bold', cursor:'pointer', marginRight:7}} onClick={()=>{
                        if(capacity()<=0) return;
                        setPickedItems(pickedItems.map(fin=>{
                            if(fin.name===ele.name) fin.amount++;
                            return fin;
                        }));
                    }}>+</span>
                    {" "}
                    <span style={{fontWeight:'bold', cursor:'pointer', marginRight:7}} onClick={()=>{
                        if(ele.amount===1) {
                            // reducing will make this zero. We want to remove this, not adjust it
                            setPickedItems(pickedItems.filter(fin=>fin.name!==ele.name));
                        }else{
                            setPickedItems(pickedItems.map(fin=>{
                                if(fin.name===ele.name) fin.amount--;
                                return fin;
                            }));
                        }
                    }}>-</span>
                    {" "}
                    <span style={{fontWeight:'bold', cursor:'pointer'}} onClick={()=>setPickedItems(pickedItems.filter(f=>f.name!==ele.name))}>
                        X
                    </span>
                </div>
            ))}
            <p className="singleline" style={{whiteSpace:'no-wrap'}}>
                <DanInput
                    placeholder="Type to search"
                    onUpdate={(f,v)=>{
                        // Create a list of all items that contain this string
                        setItemChoices(props.localItems.filter(ele => ele.name.toLowerCase().includes(v.toLowerCase())));
                    }}
                />
            </p>
            {itemChoices.map((ele,key)=> (
                <div key={key}>
                    <span className="fakelink" style={{marginRight:5}} onClick={()=>addItem(ele)}>
                        {ele.name}
                    </span>
                    (have {Math.floor(ele.amount)})
                </div>
            ))}
            <p className="singleline">
                <button
                    onClick={() => props.startWorldAction(numTravellers, pickedItems, startActions)}
                    disabled={(foodNeeded()>foodItems())?true:false}
                >
                    Start
                </button>
            </p>
            Journey requires {foodNeeded()} food

            {props.choice!='settle'?(
                ''
            ):(
                <>
                    <p className="singleline" style={{fontWeight:'bold'}}>Starting actions</p>
                    <p className="singleline">
                        <input type="checkbox" onChange={()=>setStartActions({...startActions, forage:!startActions.forage})} />
                        Forage for food
                    </p>
                    <p className="singleline">
                        <input type="checkbox" onChange={()=>setStartActions({...startActions, leantos:!startActions.leantos})} />
                        Build lean-tos for settlers
                    </p>
                </>
            )}
        </div>
    );
}
