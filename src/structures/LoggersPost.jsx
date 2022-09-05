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
                getTask: (workerx,workery) => {
                    // Here, we need to locate a tree tile that has fallen logs in it.
                    // On that note, we need to have a way to detect when all fallen bark has been used up

                    // Start from the worker's location, and expand in all directions to find some fallen wood
                    let distance = 0;
                    let flag = 0;
                    let targetx = 0;
                    let targety = 0;
                    if(tileHasLog(workerx,workery)) {
                        targetx = workerx;
                        targety = workery;
                    }else{
                        while(flag===0 || (workerx+distance>41 && workerx-distance<0 && workery+distance>41 && workery-distance<0)) {
                            for(let line=-distance; line<distance; line++) {
                                if(tileHasLog(workerx+line,workery-distance)) { // across the top
                                    flag = 1; targetx = workerx+line; targety = workery-distance;
                                }else if(tileHasLog(workerx+distance, workery+line)) { // down the right
                                    flag = 1; targetx = workerx+distance; targety = workery+line;
                                }else if(tileHasLog(workerx-line, workery+distance)) { // across the bottom
                                    flag = 1; targetx = workerx-line; targety = workery+distance;
                                }else if(tileHasLog(workerx-distance, workery-line)) { // up the left
                                    flag = 1; targetx = workerx-distance; targety = workery-line;
                                }
                            }
                            distance++;
                        }
                    }
                    return {subtask:'workatspot', targetx:targetx, targety:targety, targetitem:'Fallen Log'};
                },
                onProgress: ()=>{
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


