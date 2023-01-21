/*  ForagePost.jsx
    Code for the Forage Post, the first food source for a new colony
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";


export function ForagePost() {
    // Creates & returns a structure used to manage & build a block instance
    return {
        name: 'Forage Post',
        image: 'foragepost.png',
        prereq: [],
        locked: 0,
        featuresUnlocked: false,
        newFeatures: [],
        primary: true,
        create: (tile) => {
            // Creates & returns a Forage Post structure, while attaching it to the given tile
            let b = {
                id: game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Forage Post',
                descr: `All around you is a world teeming with life - and food. It is there for the taking, you just have to find it.`,
                usage: `Collects edible foods from the surrounding environment.  Local supplies can only support up to 4 workers. Cannot place
                        another one in this area. While enabled, a worker will continuously search for food`,
                image: "foragepost.png",
                progressBar: 0, // I think we'll use this to show the amount of food available
                progressBarMax: 8,
                progressBarColor: 'green',
                blinkState:0,
                blinker:null,
                activeTasks: [],
                keepWorking: false, // The forage post will work differently than other buildings. If this is enabled, a task will keep being
                                    // generated
                tasks: [
                    {
                        name:'Forage for Food',
                        taskType: 'fetchItem',  // fetching items only will become more prevalent when we have machines to process things
                        canAssign:()=>{
                            // This can only be assigned to one person. See if we have an active task of the same type
                            //return (b.activeTasks.findIndex(b=>b.task.name==='Forage for Food')===-1);
                            return false;  // This isn't assigned in a normal fashion
                        },
                        canAssist:false,
                        hasQuantity:false,
                        userPicksLocation: false,
                        itemsNeeded:[],
                        buildTime:0,
                        outputItems: ['Apple'],
                        create: ()=>{
                            // The Forage Post will operate a little differently than other structures. We need to have an enable/disable button
                            // for the user to click on. When enabled, a worker will continuously bring food from the surrounding environment
                            // to this location. We'll try to limit this to a single worker doing the job, not multiple

                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Forage for Food'),
                                taskType: 'fetchItem',
                                carryTox: b.x,
                                carryToy: b.y,
                                targetItem: null
                                // we deliberately have no target location. A suitable location will be selected once this is assigned to a worker
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        /*getTask: (worker)=>{
                            // Let the tutorial progress, if this is the current task.
                            if(game.tutorialModes[game.tutorialState].name==='food1') game.advanceTutorial();

                            // Here, we need to define a location for the worker to go. We want to find a block that is somewhere near the
                            // worker, so that they can check there.
                            let targetx=b.x;
                            let targety=b.y;
                            while(targetx===b.x && targety===b.y) {
                                let searchminx = Math.max(worker.x-5, 0);
                                let searchmaxx = Math.min(worker.x+5, 40);
                                let searchminy = Math.max(worker.y-5, 0);
                                let searchmaxy = Math.min(worker.y+5, 40);
                                //console.log(`Search zone: [${searchminx}-${searchmaxx},${searchminy}-${searchmaxy}]`);
                                let searchsizex = searchmaxx-searchminx;
                                let searchsizey = searchmaxy-searchminy;
                                targetx = Math.floor(Math.random()*searchsizex) +searchminx;
                                targety = Math.floor(Math.random()*searchsizey) +searchminy;
                            }
                            // There is a 1 in 5 chance that this venture will be successful
                            if(Math.floor(Math.random()*5)===0) {
                                // This trip will be successful. Go ahead and find the tile, and place a food item there for them to pick up
                                let tile = game.tiles.find(e=>e.x===targetx && e.y===targety);
                                if(typeof(tile)==='undefined') {
                                    console.log('Error - tile not found at ['+ targetx +','+ targety +']');
                                    return '';
                                }
                                tile.items.push(game.createItem('Apple', 'food', {}));
                            }
                            // Now, return the object that gets applied to the worker
                            return {subtask:'fetchitem', targetx:targetx, targety:targety, targetitem:'Apple'};
                        },*/
                        onProgress: ()=>{
                            // Allows context updates whenever progress is made on this task
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        },
                        onComplete: (worker)=>{
                            // Workers need to drop the item they're carrying at this block.
                            // Start by fetching the tile this structure is on
                            // Nothing is really needed to be done here
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    }
                ],
                update: ()=>{
                    // We should only ever have one task here at a time. See if one still exists
                    if(b.activeTasks.length>0) return;

                    // Now, create a new task, if enabled
                    if(b.keepWorking) b.tasks[0].create();
                },
        
                SidePanel: ()=> {
                    // To see our inventory, we first need to grab the tile
                    const [keepWorking, setKeepWorking] = React.useState(b.keepWorking);

                    let tile = game.tiles.find(e=>e.x===b.x && e.y===b.y);
                    if(typeof(tile)==='undefined') {
                        return <>Error: Structure's tile not found. Cannot access items</>;
                    }
                    return (
                        <>
                            <span
                                style={{backgroundColor:keepWorking?'green':'red', margin:5, padding:3, border:'1px solid black'}}
                                onClick={()=>{
                                    b.keepWorking = !b.keepWorking;
                                    if(game.tutorialModes[game.tutorialState].name==='food1') game.advanceTutorial();
                                    setKeepWorking(b.keepWorking);
                                }}
                            >
                                {keepWorking?'Enabled':'Disabled'}
                            </span>
                            <p className="singleline">Food on hand:</p>
                            {game.groupItems(tile.items).map((item,key)=>(
                                <p className="singleline" key={key} style={{marginLeft:5}}>{item.name} x{item.qty}</p>
                            ))}
                        </>
                    );
                },
                onSave: ()=>{
                    return {
                        id: b.id,
                        name: b.name,
                        x: b.x,
                        y: b.y,
                        activeTasks: b.activeTasks.map(t=>t.id)
                    };
                },
            };
            return b;
        }
    };
}


