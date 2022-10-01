/*  LoggersPost.jsx
    Handles the Loggers Post structure, that handles any work done in forests
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

export function LoggersPost() {
    return {
        name: 'Loggers Post',
        image: 'loggerspost.png',
        prereq: [['Flint Knife', 'Flint Stabber']], // Player needs one of either item
        locked: 1,
        featuresUnlocked: false,
        newFeatures: [],
        primary: true,
        create: (tile) => {
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
                hasNewTasks: [],
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
                    },{
                        name: 'Cut Long Stick',
                        // We will have a collection of sticks where there are fallen logs. Users will also be able to cut sticks off existing trees.
                        // This will generate a 'missing stick' item; When a tree is later cut down, it will not generate as many sticks from its
                        // branches
                        taskType: 'work at location',
                        canAssign: ()=>true, // this can be worked any time... for now. We'll see later
                        canAssist: true,
                        hasQuantity: true,
                        itemsNeeded: [],
                        toolsNeeded: ['Flint Stabber'],
                        buildTime: 20*40,  // 40 seconds
                        outputItems: ['Long Stick', 'Removed Stick'],
                        getTask: (worker) => {
                            // Locate a tree tile with sticks on it
                            const [targetx, targety] = game.findItemFromList(worker.x, worker.y, ['Maple Tree', 'Birch Tree', 'Oak Tree', 'Mahogany Tree',
                                'Pine Tree', 'Cedar Tree', 'Fir Tree', 'Hemlock Tree', 'Cherry Tree', 'Apple Tree', 'Pear Tree', 'Orange Tree',
                                'Hawthorn Tree', 'Dogwood Tree', 'Locust Tree', 'Juniper Tree']);
                            if(targetx===-1 && targety===-1)
                                return {subtask:'cantwork', toolNeeded:false, targetx:worker.x, targety:worker.y, message:`We couldn't find any sticks anywhere! Try something else`};
                            return {subtask:'workatspot', targetx:targetx, targety:targety};
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            // Create the stick - and the removedStick item
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            if(typeof(tile.items)==='undefined') tile.items = [];
                            tile.items.push(game.createItem('Long Stick', 'item', {}), game.createItem('Removed Stick', 'item', {}));
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name: 'Cut Short Stick',
                        taskType: 'work at location', // I'm not actually using this field... maybe get rid of it?
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: true,
                        itemsNeeded: ['Long Stick'],
                        toolsNeeded: ['Flint Stabber'],
                        buildTime: 20*40, // 40 seconds
                        outputItems: ['Short Stick'],
                        getTask: worker => {
                            // Locate a Long Stick on the map
                            const [targetx, targety] = game.findItem(worker.x, worker.y, 'Long Stick', true);
                            if(targetx===-1 && targety===-1) {
                                // We couldn't find a Long Stick. We should be able to craft one, though. Return this task without a target location.
                                // Another portion of code will be able to assign the task to create the Long Stick
                                return {subtask:'workatspot'};
                            }
                            return {subtask:'workatspot', targetx:targetx, targety:targety};
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: worker=>{
                            let tile = game.tiles.find(t=>t.x===worker.x && t.y===worker.y);
                            // Delete the long stick
                            let slot = tile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot===-1) {
                                console.log('Made short sticks, but couldnt find long stick to delete');
                            }else{
                                tile.items.splice(slot, 1);
                            }

                            // Create the short stick!
                            tile.items.push(game.createItem('Short Stick', 'item', {}), game.createItem('Short Stick', 'item', {}));
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
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
    }
}

