/*  LeanTo.jsx
    Holds all the code related to the Lean-To building
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "../game.js";
//import game from "../App.js";

export function LeanTo(tile) {
    // Returns an object that will manage activities for a new Lean-To

    let b = {
        id: game.getNextBlockId(),
        name: 'Lean To',
        x: tile.x,
        y: tile.y,
        descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
        for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
        on top, this is fast & easy to set up, but wont last long in the elements itself.`,
        usage: `Needs workers to set this up, then can be used for a time before it must be rebuilt`,
        image: "leanto.png",
        mode: 'build',
        counter: 0,
        SidePanel: ()=>{
            // Displays text for this building, when selected, on the right panel of the page
            return <p>Hello dudes!</p>;
        },
        update: () => {
            if(b.mode==='use') {
                b.counter--;
                if(b.counter<=0) b.mode='build';
            }else{
                console.log(b.counter);
            }
        },
        doWork: taskName => {
            // Allows a worker to complete work here
            // taskName: name of the job to work here. For the Lean-To, the only valid choice is 'construct'.
            if(taskName!=='construct') {
                console.log('Error in LeanTo->doWork: worker trying to complete task of '+ taskName +', but only construct is valid');
                return 'invalid';
            }
            if(b.mode==='use') {
                // This building has already been completed
                return 'done';
            }
            b.counter++;
            if(b.counter>120) {
                b.counter = 500;
                b.mode = 'use';
                return 'done';
            }
            return '';
        },
        openTasks: () => {
            // Returns a list of all current task names that this block needs done. The worker will then decide if they wish to complete
            // that task. If so, assignTask must be called with that task.
            // If there are no tasks, an empty array will be returned.
            if(b.mode==='use') return [];
            return ['construct']; // Task names are defined from a fixed list
        },
        assignTask: worker => {
            // Allows this building to assign a task for a worker to do
            if(typeof(worker)==='undefined') {
                console.log('Error in LeanTo->assignTask(): Worker provided is undefined');
                return;
            }
            if(b.mode==='use') {
                console.log('Error in LeanTo->assignTask(): There is no work needed here');
                return;
            }
            
            worker.buildingId = b.id;
            worker.currentTask = "construct";

            // Well, I'm not really sure what else we need to do right now. We need to organize the next operations, to determine how
            // good we've done here
        }
    };
    return b;
}
