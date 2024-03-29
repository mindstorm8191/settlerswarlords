/*  RockKnapper.jsx
    Code for the Rock Knapper, a way to create the first tools
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";

export function RockKnapper() {
    
    return {
        name: 'Rock Knapper',
        image: 'rockknapper.png',
        prereq: [],
        locked: 0,
        featuresUnlocked: false,
        newFeatures: ['Small Rope'],
        primary: true,
        create: (tile) => {
            
            // First, check the land type. This can only be built on barren rock
            if(tile.newlandtype===-1) {
                if(tile.landtype!==21) {
                    return 'wrong land type';
                }
            }else{
                if(tile.newlandtype!==21) {
                    // Both must be 21 or this won't work
                    return 'wrong land type';
                }
            }
            console.log(tile);

            let b = {
                id: game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Rock Knapper',
                descr: `Tools are critical to survival, and rocks are your first tool. Knapping is the art of smashing rocks into the shapes you need.`,
                usage: `Knapps rocks to craft tools. Knives or stabbers can be made without any parts. Other tools can be made using wood & twine`,
                image: "rockknapper.png",
                progressBar: 0,
                progressBarMax: 8,
                progressBarColor: 'green',
                blinkState:0,
                blinker:null,
                hasNewTasks: ['Small Rope'], // This determines when the block will highlight green when new features become available
                activeTasks: [],
                tasks: [
                    {
                        name: 'Craft Flint Knife',
                        taskType: 'craftOnSite',
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: [],
                        toolsNeeded: [],
                        buildTime: 20*20,
                        outputItems: ['Flint Knife'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Flint Knife'),
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                ticksToComplete: 20*20
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            // Allows context updates whenever progress is made on this task
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            // Add an item to this block's inventory
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            if(typeof(tile)==='undefined') {
                                console.log('Error in RockKnapper->tasks->Flint Knife->onComplete(): tile not found at '+ b.x +','+ b.y);
                                return;
                            }
                            if(typeof(tile.items)==='undefined') {
                                // This tile is missing an inventory... why not just add it now?
                                tile.items = [];
                            }
                            // Well, I was going to put all similar items together, but each one can have different endurance values & efficiency
                            // rates... it'll be better to keep each one separate
                            tile.items.push(game.createItem('Flint Knife', 'tool', {efficiency:1, endurance:20*60})); // this lasts only a minute
                            tile.modified = true;

                            if(game.tutorialModes[game.tutorialState].name==='tools1') game.advanceTutorial();

                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name:'Craft Flint Stabber',
                        taskType: 'craft on site',
                        canAssign: ()=>true,
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: [],
                        toolsNeeded: [],
                        buildTime: 20*20,
                        outputItems: ['Flint Stabber'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Flint Stabber'),
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                ticksToComplete: 20*20
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            // Allows context updates whenever progress is made on this task
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            if(game.tutorialModes[game.tutorialState].name==='tools1') game.advanceTutorial();
                            
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            if(typeof(tile.items)==='undefined') tile.items = [];
                            tile.items.push(game.createItem('Flint Stabber', 'tool', {efficiency:1, endurance:20*60*2}));
                            tile.modified = true;
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name:'Craft Flint Hatchet',
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: ['Short Stick', 'Small Rope'],
                        toolsNeeded: [],
                        buildTime: 20*40,
                        outputItems: ['Flint Hatchet'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Flint Hatchet'),
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                itemsNeeded: [{name: 'Short Stick', qty: 1, hasItem:false}, {name:'Small Rope', qty:1, hasItem:false}],
                                ticksToComplete: 20*40
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            // delete the used items from this tile
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Short Stick');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Hatchet->onComplete: could not find Short Stick. Crafting anyway');
                            }
                            slot = tile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Hatchet->onComplete: could not find Small Rope. Crafting anyway');
                            }
                            // now drop the Flint Hatchet
                            tile.items.push(game.createItem('Flint Hatchet', 'tool', {efficiency:2, endurance:20*60*5})); // aka 5 minutes
                            tile.modified = true;
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name:'Craft Flint Shovel',
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: ['Long Stick', 'Small Rope'],
                        toolsNeeded: [],
                        buildTime: 20*45,
                        outputItems: ['Flint Shovel'],
                        //getTask: (w) => ({subtask:'workonsite', targetx:b.x, targety:b.y}),
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Flint Shovel'),
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                itemsNeeded: [{name: 'Long Stick', qty: 1, hasItem: false}, {name: "Small Rope", qty:1, hasItem:false}],
                                ticksToComplete: 20*45
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Shovel->onComplete: could not find Short Stick. Crafting anyway');
                            }
                            slot = tile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Shovel->onComplete: could not find Small Rope. Crafting anyway');
                            }
                            tile.items.push(game.createItem('Flint Shovel', 'tool', {efficiency:1, endurance:20*60*7})); // 7 minutes
                            tile.modified = true;
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name:'Craft Flint Spear',
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: ['Long Stick', 'Small Rope'],
                        toolsNeeded: [],
                        buildTime: 20*50,
                        outputItems: ['Flint Spear'],
                        //getTask: (w) => ({subtask:'workonsite', targetx:b.x, targety:b.y}),
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Flint Spear'),
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                itemsNeeded: [{name: 'Long Stick', qty: 1, hasItem:false}, {name:'Small Rope', qty:1, hasItem:false}],
                                ticksToComplete: 20*50
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Short Stick');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Spear->onComplete: could not find Short Stick. Crafting anyway');
                            }
                            slot = tile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Spear->onComplete: could not find Small Rope. Crafting anyway');
                            }
                            tile.items.push(game.createItem('Flint Spear', 'tool', {efficiency:1, endurance:20*60*10})); // 10 minutes
                            tile.modified = true;
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name: 'Craft Flint Scythe',
                        canAssign: ()=>game.unlockedItems.includes('Small Rope'),
                        canAssist: true,
                        hasQuantity: true,
                        userPicksLocation: false,
                        itemsNeeded: ['Long Stick', 'Short Stick', 'Small Rope'],
                        toolsNeeded: [],
                        buildTime: 20*90, // aka 1.5 minutes
                        outputItems: ['Flint Scythe'],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Craft Flint Scythe'),
                                taskType: 'workAtBuilding',
                                targetx: b.x,
                                targety: b.y,
                                itemsNeeded: [{name: 'Long Stick', qty: 1, hasItem:false}, {name: 'Short Stick', qty: 1, hasItem:false}, {name:'Small Rope', qty:1, hasItem:false}],
                                ticksToComplete: 20*90
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: ()=>{
                            let tile = game.tiles.find(t=>t.x===b.x && t.y===b.y);
                            let slot = tile.items.findIndex(i=>i.name==='Long Stick');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Scythe->onComplete: could not find Long Stick. Crafting anyway');
                            }
                            slot = tile.items.findIndex(i=>i.name==='Short Stick');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Scythe->onComplete: could not find Short Stick. Crafting anyway');
                            }
                            slot = tile.items.findIndex(i=>i.name==='Small Rope');
                            if(slot!==-1) {
                                tile.items.splice(slot,1);
                            }else{
                                console.log('Error in Flint Scythe->onComplete: Could not find Small Rope. Crafting anyway');
                            }
                            tile.items.push(game.createItem('Flint Scythe', 'tool', {efficiency:1, endurance:20*60*5})); // 5 minutes
                            tile.modified = true;
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    }
                ],

                SidePanel: ()=> {
                    let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
                    if(typeof(tile)==='undefined') {
                        return <>Error: Block's tile not found. Cannot access items</>;
                    }
                    return (
                        <>
                            <p className="singleline">Items here:</p>
                            {game.groupItems(tile.items).map((item,key)=>(
                                <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                            ))}
                        </>
                    );
                },
                onSave: ()=> {
                    return {
                        id: b.id,
                        name: "Rock Knapper",
                        x: b.x,
                        y: b.y,
                        activeTasks: b.activeTasks.map(t=>t.id)
                    };
                },
                onLoad: pack=>{
                    b.id = pack.id;
                    b.progressBar = pack.progressBar;
                    b.activeTasks = pack.activeTasks;
                }
            }
            return b;
        }
    }
}
