/*  LeanTo.jsx
    Handles all code related to the Lean-To structure
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function LeanTo() {
    // Returns a structure used to build & manage the Lean-To block type
    return {
        name: 'Lean-To',
        image: 'leanto.png',
        prereq: [],
        locked: 0,
        primary: true,
        featuresUnlocked: false,
        newFeatures: [],
        canBuild: (tile) => {
            // returns true if this building can be built at this location, or false if not
            if(parseInt(tile.newlandtype)===-1) {
                return [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].includes(tile.landtype);
            }
            return [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].includes(tile.newlandtype);
        },
        create: (tile) => {
            // Produces a new structure instance, placing it on the provided tile.
            // The lean-to is a crude shelter made from a fallen tree branch and leaves piled on top
            // It is certainly not a great shelter, but can be made on the fly in the wilderness, and doesn't even require tools

            // Start by checking the land type chosen. Lean-tos can only be created from trees... we seem to have a lot of those...
            if(![5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].includes(parseInt(tile.newlandtype) === -1 ? tile.landtype : tile.newlandtype)) {
                return 'wrong land type';
            }
            // Next, create our object. We need to do this so the object can be modified (with Object Composition) before returning it
            let b = {
                id: game.getNextBlockId(),
                x: tile.x,
                y: tile.y,
                name: 'Lean-To',
                descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                        for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                        on top, this is fast & easy to set up, but wont last long in the elements itself.`,
                usage: `Your workers must set this up. Once built, it will function for a few nights, then have to be rebuilt`,
                image: 'leanto.png', // This is already set with the path to img/structures
                mode:'build',
                progressBar: 0,
                progressBarMax: 1800, // This totals 1.5 minutes. But with 4 workers building it, it'll be done in ~22 seconds
                progressBarColor: 'green',
                assignedWorkers: [], // This will only hold ids of workers
                blinkState:0,
                blinker:null,
                activeTasks: [], // list of active tasks at this building, coupled with its progress and the worker

                tasks: [
                    {
                        name: 'Build',
                        taskType: 'construct',
                        canAssign: () => {
                            if(b.mode==='use') return false; // if the lean-to runs out of time during use, its mode will become Collapsed
                            if(b.activeTasks.length!==0) return false; // This can't be assigned twice
                            return true;
                        },
                        canAssist: true,
                        hasQuantity: false, // set to true if the player can set a specific quantity to make of this
                        userPicksLocation: false,  // true if the user needs to select a location on the map for this task to happen at.
                        itemsNeeded: [],
                        buildTime: (20*30*3), // 1.5 minutes
                        outputItems: [],
                        create: () => {
                            // Generates a new task instance, returning it. This is also saved to the game's tasks list

                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.name==='Build'),
                                taskType: 'construct',
                                targetx: b.x,
                                targety: b.y,
                                ticksToComplete: 20*60*1.5 // aka 1.5 minutes
                            });
                            b.activeTasks.push(task);
                            if(game.tutorialModes[game.tutorialState].name==='shelter1') game.advanceTutorial();
                            return task;
                        },
                        onProgress: ()=>{
                            // Allows context updates whenever progress is made on this task
                            if(typeof(b.blinker)==='function') {
                                b.blinkState++;
                                b.blinker(b.blinkState);
                            }
                            // We also need to update this block's progress bar. That means finding the active task for this
                            let task = b.activeTasks.find(t=>t.task.name==='Build');
                            b.progressBar = task.progress;
                        },
                        onComplete: (worker)=> {
                            b.mode = 'use';
                            b.progressBar = (20*60*20); // aka 20 minutes
                            if(typeof(b.blinker)==='function') b.blinker(++b.blinkState);
                        }
                    },{
                        name: 'Repair',
                        taskType: 'construct',
                        canAssign: ()=> {
                            if(b.mode!=='use') return false;
                            if(b.activeTasks.length!==0) return false; // This can't be assigned twice
                            if(b.progressBar> (20*60*15)) return false; // This can't be repaired unless it's been standing for 5 minutes
                            return true;
                        },
                        canAssist: true,
                        hasQuantity:false,
                        userPicksLocation: false,
                        itemsNeeded: [],
                        toolsNeeded: [],
                        buildTime: (20*30), // 30 seconds
                        outputItems: [],
                        create: ()=>{
                            let task = game.createTask({
                                building: b,
                                task: b.tasks.find(t=>t.anme==='Repair'),
                                taskType: 'construct',
                                targetx: b.x,
                                targety: b.y,
                                ticksToComplete: 20*30
                            });
                            b.activeTasks.push(task);
                            return task;
                        },
                        onProgress: ()=>{
                            // Allows context updates whenever progress is made on this task
                            if(typeof(b.blinker)==='function') {
                                b.blinkState++;
                                b.blinker(b.blinkState);
                            }
                        },
                        onComplete: (worker)=>{
                            b.progressBar += (20*60*5); // adds 5 minutes of life
                        }
                    }
                ],
                update: ()=>{
                    if(b.mode==='use') {
                        // This building's health will degrade over time
                        b.progressBar--;
                        if(typeof(b.blinker)==='function') {
                            b.blinkState++;
                            b.blinker(b.blinkState);
                            // Perhaps updating this every frame, when actual display only happens occasionally, is overkill. But better than
                            // nothing, and it's simpler to manage.
                        }
                        if(b.progressBar>0) return;
                        // This has run out of wear time. Set back to the pre-built state
                        b.mode = 'build';
                        b.progressBar = 0;
                    }
                    if(b.mode==='build') {
                        // First, see if we have an active construction task going
                        if(b.activeTasks.length===0) return;
                        // Check if we still have access to the correct object here
                        if(typeof(b.blinker)==='function') {
                            b.blinkState++;
                            b.blinker(b.blinkState);
                        }
                    }
                },

                //hasWork: () => {}, This can now be found programmatically by running canAssign on each of the above tasks
                //canAssist: ()=>{}, Players now manually assign helpers; this is decided on the task at hand
                //assignWorker: newWorker=>{}, Assigning workers is now done via LocalMapBuildingDetail, and handled the same way for all structures
                //getTask: worker=>{}, Getting tasks is done through the task object, not here
                //doWork: action=>{}, Work progress is (for now) handled in game.tick, where progress is updated through the active task
                
                SidePanel: (props)=>{
                    // Here, we want to show when this building is in construction, and how much progress has been made

                    //const [blink,setBlink] = React.useState(0);
                    //b.blinker = setBlink;
                    // instead of watching Blink here, we need to watch it in localMap

                    if(b.mode==='build') {
                        if(b.activeTasks.length===0) {
                            return <>Needs construction</>;
                        }
                        return <>Under construction: {Math.floor((parseFloat(b.activeTasks[0].progress)/parseInt(b.activeTasks[0].ticksToComplete))*100)}%</>;
                    }
                    return <>In use. Health: {Math.round((parseFloat(b.progressBar)/(20*60*20))*100)}%</>;
                },
                onSave: ()=>{
                    // Outputs data about this structure, so that it can be loaded again
                    return {
                        id: b.id,
                        name: 'Lean-To',
                        x: b.x,
                        y: b.y,
                        mode: b.mode,
                        progressBar: b.progressBar,
                        activeTasks: b.activeTasks.map(t=>t.id)
                    };
                },
                onLoad: content => {
                    b.id = content.id;
                    b.mode = content.mode;
                    b.progressBar = content.progressBar;
                    b.activeTasks = content.activeTasks; // for now, we'll only be able to store the task ids. We'll have to associate them later
                }
            }

            // If the tutorial state is at the right point, we need to advance it to the next task
            if(game.tutorialModes[game.tutorialState].name==='shelter1') game.advanceTutorial();

            return b;
        }
    };
}


