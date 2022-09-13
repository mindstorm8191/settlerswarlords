/*  LoggersPost.jsx
    Handles the Loggers Post structure, that handles any work done in forests
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

export function LoggersPost(tile) {
    // Create & returns a Loggers Post block instance.

    let b = {
        id:game.getNextBlockId(),
        x: tile.x,
        y: tile.y,
        name: 'Loggers Post',
        descr: 'Wood is a valuable asset for producing many tools and other things',
        image: 'loggerspost.png',
        progressBar: 0,
        progressBarMax: 20,
        progressBarColor: 'brown',
        blinkState: 0,
        blinker:null,
        activeTasks:[],
        tasks: [
            {
                name:'Get Twine from Aged Wood',
                taskType: 'work at location',
                canAssign: ()=>true,    // This can be assigned at any point
                canAssist: true,
                hasQuantity: true,
                itemsNeeded: [],
                toolsNeeded: ['Flint Knife'],
                buildTime: 20*25, // aka 25 seconds
                outputItems: ['Twine Strips', 'Debarked Fallen Tree'],
                getTask: (worker) => {
                    // We need to locate a tree tile that has fallen logs on it.

                    // Here, we need to locate a tree tile that has fallen logs in it.
                    // On that note, we need to have a way to detect when all fallen bark has been used up

                    const [targetx, targety] = game.findItem(worker.x,worker.y,'Fallen Log');
                    if(targetx===-1 && targety===-1) {
                        // We searched the whole area, and there isn't any to find!
                        return {subtask:'cantwork', toolNeeded:false, targetx:worker.x, targety:worker.y, message:`We searched the whole map, there's no Fallen Logs to find! Try something else`};
                    }

                    return {subtask:'workatspot', targetx:targetx, targety:targety, targetitem:'Fallen Log'};
                },
                onProgress: ()=>{
                    // Find the worker that has this task
                    //let active = b.activeTasks.find(a=>a.task.name="Get Twine from Aged Wood");
                    console.log(b.activeTasks);
                    if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                },
                onComplete: (worker)=>{
                    // Allows state changes when this task is complete
                    // We want to leave the twine shavings here
                    //let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                    //let slot = worker.carrying.findIndex(i=>i.name==='Twine Strips');
                    //tile.items.push(worker.carrying.splice(slot,1));
                    let tile = game.tiles.find(t=>t.x === worker.x && t.y===worker.y);
                    let logSlot = tile.items.findIndex(i=>i.name==='Fallen Log');
                    if(tile.items[logSlot].amount>1) {
                        tile.items[logSlot].amount--;
                    }else{
                        tile.items.splice(logSlot,1);
                    }
                    // Unlike previous design, we want to add each debarked log portion individually
                    tile.items.push(game.createItem('Debarked Fallen Log', 'item', {}));
                    tile.items.push(game.createItem('Twine Strips', 'item', {}));
                }
            }
        ],
        SidePanel: ()=>{
            let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
            if(typeof(tile)==='undefined') {
                return <>Error: Block's tile not found. Cannot access items</>;
            }
            return (
                <>
                    <p className="singleline">Items on hand:</p>
                    {game.groupItems(tile.items).map((item,key)=>(
                        <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                    ))}
                </>
            );
        }
    };
    return b;
}

function tileHasLog(x,y) {
    // returns true if the tile location has a fallen log in it
    if(x<0 || x>41) return false;
    if(y<0 || y>41) return false;

    let tile = game.tiles.find(t=>t.x===x && t.y===y);
    if(typeof(tile)==='undefined') return false;

    return tile.items.some(i=>i.name==='Fallen Log');
}


