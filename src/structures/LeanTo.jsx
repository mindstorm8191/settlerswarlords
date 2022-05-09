/*  LeanTo.jsx
    Handles all code related to the Lean-To structure
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.jsx";

export function LeanTo(tile) {
    // Allows a new building to be created - our first! The lean-to is a crude shelter made from a fallen tree branch and leaves piled
    // on top. It is certainly not a great shelter, but can be made on the fly in the wilderness, and doesn't even require tools

    // Start by checking the land type chosen. Lean-tos can only be created from trees
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

        hasWork: () => {
            // Returns true if this building has work available
            if(b.mode!=='build') return false;
            if(b.assignedWorkers.length>0) return false; // Since this only has a build option, we only need one worker here
            return true;
        },
        canAssist: ()=>{
            // Returns true or false if other workers can assist someone on a task at this building
            return true;
        },
        assignWorker: (newWorker) => {
            // Marks a given worker as working at this building
            b.assignedWorkers.push(newWorker.id);
        },
        getTask: (worker) => {
            // Gives a worker a task to complete at this building
            if(b.mode!=='build') return;
            worker.task = 'construct';
            worker.targetx = b.x;
            worker.targety = b.y;
            
            return worker;
            // 'construct' requires that the worker goes to the structure's location. Once there, they can doWork().
        },
        doWork: (action) => {
            // Allows a worker to do work at this building
            // Since there is only one action here, we won't worry about the action value we get
            if(b.mode!=='build') return false;
            b.progressBar++;
            //if(b.progressBar%100===0) console.log("Lean-to building...");
            
            if(b.progressBar>=b.progressBarMax) {
                b.mode = 'use';
                console.log("Lean-to is ready for use!");
                return false;
            }
            return true;
        },

        SidePanel: (props)=>{
            if(b.mode==='build') {
                return <>Under construction.</>;
            }
            return <>In use.</>;
        }
    }
    return b;
}
