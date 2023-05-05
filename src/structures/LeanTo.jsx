/*  LeanTo.jsx
    Provides a lean-to, a primitive structure that can be built anywhere with trees. Consists only of a stick leaning against a tree,
    with leafy branches laid on top
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function LeanTo() {
    // Returns an object that can generate new game structures
    return {
        name: 'Lean-To',
        image:'leanto.png',
        tooltip: 'Your first shelter',
        locked: 0, // This is set to 1 if it has prerequisites that must be met before-hand
        prereqs: [],
        newFeatures: [], // 
        canBuild: (tile)=>{
            // Returns true if this structure can be built here
            // Any tile with trees in it will do
            if(tile.newlandtype===-1) {
                if(tile.landtype>=5 && tile.landtype<=20) return '';
                return 'This must be placed on a tile with trees';
            }
            if(tile.newlandtype>=5 && tile.newlandtype<=20) return '';
            return 'This must be placed on a tile with trees';
        },
        create: (tile)=>{
            let b = {
                id: game.getNextStructureId(),
                x: tile.x,
                y: tile.y,
                name: 'Lean-To',
                descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                        for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                        on top, this is fast & easy to set up, but wont last long in the elements itself.`,
                usage: `Your workers must set this up. Once built, it will function for a few nights, then need to be rebuilt. Or you can
                        repair it before it fails`,
                image: 'leanto.png',
                mode: 'build',
                progress: 0,
                activeTasks: [],  // why do we need whole tasks here? Just store the IDs, we can look them up as needed
                blinker: null,
                blinkValue: 0,
                update: (value)=>{
                    if(b.blinker!==null) b.blinker(value);
                    //b.blinkValue++;
                    //if(b.blinker!==null) b.blinker(b.blinkValue);
                },
                tasks: [
                    {
                        name: 'Build',
                        desc: 'Build this lean-to structure',
                        taskType: 'construct',
                        workLocation: 'structure', // this is either 'structure' or 'onsite'
                        itemsNeeded: [],
                        outputItems: [],
                        buildTime: (20*60*1.5), // 1.5 minutes
                        hasQuantity: false, // set to true for this task to request a production quantity when assigning
                        canAssign: ()=>{
                            // Returns true if this task can be assigned, or false if not
                            if(b.activeTasks.length>0) return false;
                            return b.mode==='build';
                        },
                        onProgress: progress =>{
                            // Handles changes as the task gets completed. Not all tasks will include this function
                            b.progress = progress;
                            b.update(progress);
                        },
                        onComplete: ()=>{
                            // Determines what happens when the task is completed. Not all tasks will include this attribute
                            b.mode = 'inuse';
                            b.progress = (20*60*20); // 20 minutes
                            //b.update(b.progress);
                        }
                    }
                ],

                SidePanel: ()=>{
                    return <div>Mode: {b.mode}</div>;
                },

                onSave: ()=>{
                    // Returns data related specifically to this structure
                    return {
                        mode: b.mode,
                        progress: 0
                    };
                },
                onLoad: (pack) =>{
                    b.mode = pack.mode;
                    b.progress = pack.progress;
                }
            };
            return b;
        }
    };
}


