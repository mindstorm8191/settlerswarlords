/*  ItemMover.jsx
    Allows workers to collect items to be placed in another building. This serves as the conveyor belt and loading system of early technology, before any power is available,
    relying solely on workers to put items where they need to be.
    For the game Settlers & Warlords
*/

import React from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { textureURL } from "../App.js";
import { game } from "../game.jsx";

export default function ItemMover() {
    // Returns an object that can generate new Item Mover structures. These are used to put specific items into nearby tiles, for other machines / shops to make use of.

    return {
        name: 'Item Mover',
        image: 'itemhauler.png',
        tooltip: 'Move items to where you need them',
        locked: 0,
        prereq: [],
        canBuild: (tile)=>true,
        create: (tile) => {
            let b = {
                name: 'Item Mover',
                descr: `There are great technologies to allow items to be moved from place to place, but you have access to none of them yet. That's okay, you can use your workers
                        to do it`,
                image: 'itemhauler.png',
                id: game.getNextStructureId(),
                workProgress: 0,
                workerAssigned: null,
                position: [tile.x, tile.y, tile.z],
                size: [1,1,1],
                recipe: null,
                rotation: 0, // value between 0 & 3 to determine the orientation of this tile. The arrow will determine the tile where workers dump items at.
                itemsList: [],  // name, sourceCoordsList
                recipes: [
                    // We can add more types of item movers: by using buckets, wheelbarrows, small air tanks, etc
                    // We will assign a worker to this after we have items set to be moved
                    {
                        name: "Move items",
                        workerTime: 1,
                        toolsNeeded: [],
                        canAssign: ()=>true, // This can be assigned at any time
                        canWork: ()=> {
                            // Returns true if there is work that workers can do here

                            let targetTile = b.adjustByFacing(); 
                            let mytile = game.tiles[targetTile[0]][targetTile[1]][targetTile[2]];
                            if(typeof(mytile.items)==='undefined') mytile.items = [];
                            if(b.itemsList.map(i=>(mytile.items.reduce((carry,item)=>{
                                // Here, map() generates a list of numbers - we don't need to hold onto the names at that point
                                if(item.name===i.name) {
                                    carry++;
                                }
                                return carry;
                            }, 0))).some(i=>(i>5))) {
                                // At least one of them was above 5
                                // Oh... this will not produce the intended result when dealing with multiple items.
                                // We will need to use .every() instead. At the same time, we will need to modify the rest of this function to factor out items we already
                                // have a sufficient supply of. We will need to do the same in workLocation().
                                // The value of 5 is arbitrary right now. Later recipes may need more. This gives us no way to account for that. We will need to examine
                                // the recipe of the structure at the target tile, if there is one, and set values based on that. It could get into some difficult work, there.
                                return 'Target tile full';
                            }
                            
                            // Search the 11x3x11 area for any target items to place here.
                            for(let x=b.position[0]-10; x<b.position[0]+10; x++) {
                                for(let y=b.position[1]-1; y<b.position[1]+1; y++) {
                                    for(let z=b.position[2]-10; z<b.position[2]+10; z++) {
                                        if(
                                            typeof(game.tiles[x])==='undefined' ||
                                            typeof(game.tiles[x][y])==='undefined' ||
                                            typeof(game.tiles[x][y][z])==='undefined'
                                        ) {
                                            continue; // Skip for now, as nothing is loaded here
                                        }
                                        if(typeof(game.tiles[x][y][z].items)==='undefined') continue; // No items are here to begin with
                                        
                                        if(x===targetTile[0] && y===targetTile[1] && z===targetTile[2]) continue; // This is where we should be putting items; don't count this tile

                                        if(game.tiles[x][y][z].items.some(i=> {
                                            return b.itemsList.some(j=>j.name===i.name);
                                        })) {
                                            //console.log('We found something to get!');
                                            return '';
                                        }
                                    }
                                }
                            }
                            
                            // We got no hits from anything
                            return 'Cannot find items to move nearby';
                        },
                        workLocation: (tile,position) => {
                            // This is called when a worker is determining where to be to complete this job.
                            // For this job, we need to first go to where the item should be located

                            let targetTile = b.adjustByFacing();
                            if(b.workerAssigned===null) {
                                console.log('Warning: ItemMover.workLocation called without having a worker assigned');
                                return;
                            }

                            // This is called both before a worker picks up an item, and when they reach the drop-off location
                            // See if they are carrying an item that should be dropped off by this machine
                            if(b.workerAssigned.carrying.some(i=>b.itemsList.some(j=>j.name===i.name))) {
                                console.log('Carrying a target item!');
                                // While carrying a target item, the only correct destination is the drop-off place
                                return (targetTile[0]===position[0] && targetTile[1]===position[1] && targetTile[2]===position[2]);
                            }
                            
                            // First, determine that this isn't the destination tile. No need to move items from here...
                            if(targetTile[0]===position[0] && targetTile[1]===position[1] && targetTile[2]===position[2]) return false;
                            if(typeof(tile.items)==='undefined') return false;

                            return tile.items.some(i=>(
                                b.itemsList.some(j=>j.name===i.name)
                            ));
                        },
                        doWork: () => {
                            // Here, the worker is either at the item source location, or at the drop-off location.
                            //let targetTile = adjustByFacing(b.position, b.rotation);
                            let targetTile = b.adjustByFacing();
                            //console.log('ItemMover->doWork(): worker ['+ b.workerAssigned.spot[0] +','+ b.workerAssigned.spot[1] +','+ b.workerAssigned.spot[2] +'], tile=['+ targetTile[0] +','+ targetTile[1] +','+ targetTile[2] +']');
                            if(b.workerAssigned.spot[0]===targetTile[0] && b.workerAssigned.spot[1]===targetTile[1] && b.workerAssigned.spot[2]===targetTile[2]) {
                                // This is the drop-off location
                                //console.log('ItemMover at unload site');
                                //console.log(b.workerAssigned.carrying);
                                let mytile = game.tiles[targetTile[0]][targetTile[1]][targetTile[2]];
                                if(typeof(mytile.items)==='undefined') mytile.items = [];
                                for(let i = b.workerAssigned.carrying.length-1; i>=0; i--) {
                                    if(b.itemsList.some(u=>u.name===b.workerAssigned.carrying[i].name)) {
                                        mytile.items.push(b.workerAssigned.carrying[i]);
                                        b.workerAssigned.carrying.splice(i,1);
                                    }
                                }
                                if(b.recipe.canWork()==='') return;
                                b.workerAssigned.job = null;
                                b.workerAssigned = null;
                                return;
                            }
                            //console.log('ItemMover picking up item');
                            // This is the item's location.
                            let mytile = game.tiles[b.workerAssigned.spot[0]][b.workerAssigned.spot[1]][b.workerAssigned.spot[2]];
                            if(typeof(mytile)==='undefined') {
                                console.log('Error in ItemMover: tile not found at ['+ b.workerAssigned.spot[0] +','+ b.workerAssigned.spot[1] +','+ b.workerAssigned.spot[2] +']');
                                return;
                            }
                            if(typeof(mytile.items)==='undefined') {
                                console.log('Error in ItemMover: got to pickup site and no items list?', mytile);
                                return;
                            }
                            let slot = mytile.items.findIndex(i=>b.itemsList.some(u=>u.name===i.name));
                            if(slot===-1) {
                                console.log('Error in ItemMover: did not find any target items', b.itemsList, mytile.items);
                            }
                            b.workerAssigned.carrying.push(mytile.items[slot]);
                            mytile.items.splice(slot,1);

                            // Now travel to the target drop-off location
                            b.workerAssigned.waitingForPath = true;
                            game.pathTo(b.workerAssigned.spot[0], b.workerAssigned.spot[1], b.workerAssigned.spot[2], 100,
                                (tile,position) => (position[0]===targetTile[0] && position[1]===targetTile[1] && position[2]===targetTile[2]),
                                (result) => {
                                    b.workerAssigned.waitingForPath = false;
                                    if(result.result!=='success') {
                                        console.log('Error in pathfinding', result);
                                    }else{
                                        console.log('ItemMover: Set path to target: '+ result.path);
                                        b.workerAssigned.path = result.path;
                                    }
                                }
                            );
                        }
                    }
                ],
                Render: ()=> {
                    const texture = useLoader(TextureLoader, textureURL +"structures/itemhauler.png");
                    return (
                        <mesh position={[b.position[0], .1, b.position[2]]} rotation={[-Math.PI/2,0,(-Math.PI/2*b.rotation)]}>
                            <planeGeometry args={[1,1]} />
                            <React.Suspense fallback={<meshPhongMaterial color={"orange"} />}>
                                <meshStandardMaterial map={texture} />
                            </React.Suspense>
                        </mesh>
                    );
                },
                RightPanel: ()=> {
                    const [addState, setAddState] = React.useState(0);
                    const [filter, setFilter] = React.useState('');
                    return (
                        <div>
                            <div
                                style={{marginBottom:7}}
                                className="fakelink"
                                onClick={()=>{
                                    b.rotation++;
                                    if(b.rotation>=4) b.rotation=0;
                                    console.log(b.adjustByFacing());
                                }}
                            >
                                Rotate Output
                            </div>
                            <div style={{marginBottom:12}}>
                                Pickup Items: <br />
                                {(b.itemsList.length===0?'none':
                                    b.itemsList.map((item,key) => {
                                        return <div key={key}>{item.name}</div>;
                                    })
                                )}
                                {addState===0?(<div className="fakelink" onClick={()=>setAddState(1)}>Add Item</div>):(
                                    <form>
                                        <input onChange={(event)=>{setFilter(event.target.value.toLowerCase());}}/>
                                        {(filter===''?'':
                                            game.unlockedItems.filter(i => i.toLowerCase().indexOf(filter)!==-1)
                                            .map((i,key)=>(
                                                <div
                                                    key={key}
                                                    className="fakelink"
                                                    style={{border:'1px solid black', padding:2}}
                                                    onClick={()=>{
                                                        b.itemsList.push({name:i, sourceCoordList:[]});
                                                        setFilter('');
                                                        setAddState(0);
                                                    }}
                                                >
                                                    {i}
                                                </div>
                                            )))}
                                    </form>
                                )}
                                
                            </div>
                        </div>
                    );
                },
                save: () => {
                    // Save relevant data of this structure to the server
                    return {rotation: b.rotation, itemsList: b.itemsList};
                },
                onLoad: (pkg) => {
                    b.rotation = pkg.rotation;
                    b.itemsList = pkg.itemsList;
                    console.log(b.itemsList);
                },
                adjustByFacing: () => {
                    switch(b.rotation) {
                        case 0: return [b.position[0]+1, b.position[1], b.position[2]];
                        case 1: return [b.position[0], b.position[1], b.position[2]+1];
                        case 2: return [b.position[0]-1, b.position[1], b.position[2]];
                        case 3: return [b.position[0], b.position[1], b.position[2]-1];
                        default: return [b.position[0], b.position[1], b.position[2]];
                    }
                }
            };
            b.recipe = b.recipes[0];
            tile.structure = b.id;
            tile.modified = 1;
            return b;
        }
    }
}