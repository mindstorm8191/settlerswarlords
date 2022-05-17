/*  ForagePost.jsx
    Code for the Forage Post, the first food source for a new colony
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "../game.jsx";


export function ForagePost(tile) {
    // Creates & returns a Forage Post block instance. This is the first source of food for new encampments.

    let b = {
        id: game.getNextBlockId(),
        x: tile.x,
        y: tile.y,
        name: 'Forage Post',
        descr: `All around you is a world teeming with life - and food. It is there for the taking, you just have to find it.`,
        usage: `Collects edible foods from the surrounding environment.  Local supplies can only support up to 4 workers. Cannot place
                another one in this area`,
        image: "foragepost.png",
        progressBar: 0, // I think we'll use this to show the amount of food available
        progressBarMax: 8,
        progressBarColor: 'green',
        assignedWorkers: [],
        hasWork: () => {
            // Returns true if this building has work that can be assigned
            
            // Before checking assigned workers, refresh the full list
            b.assignedWorkers = game.blockCheckAssignedWorkers(b.id);
            if(b.assignedWorkers.length>0) return false;  // This block can only accept one worker
            return true;
        },
        canAssist: ()=> {
            // returns true/false if other workers can assist someone at this building.
            return false;
        },
        assignWorker: (newWorker) => {
            b.assignedWorkers.push(newWorker.id);
        },
        getTask: (worker) => {
            // Gives a worker a task to complete at this building

            // Unlike other blocks, this will leave the worker running around searching for foods
            // We want to have the workers looking randomly within 5 blocks of themselves, and picking up items 20% of the time.
            // After so long, the success rate of their searches should diminish... we'll worry about that later

            // I could consolidate this code to 2 lines, but it's not really necessary
            let searchminx = Math.max(worker.x-5, 0);
            let searchmaxx = Math.min(worker.x+5, 40);
            let searchminy = Math.max(worker.y-5, 0);
            let searchmaxy = Math.min(worker.y+5, 40);
            let searchsizex = searchmaxx-searchminx;
            let searchsizey = searchmaxy-searchminy;
            let targetx = Math.floor(Math.random()*searchsizex) +searchminx;
            let targety = Math.floor(Math.random()*searchsizey) +searchminy;
            if(Math.floor(Math.random()*5)===0) {
                // This trip will be successful. Go ahead and find the tile, and place a food item there for them to pick up
                let tile = game.tiles.find(e=>e.x===targetx && e.y===targety);
                if(typeof(tile)==='undefined') {
                    console.log('Error - tile not found at ['+ targetx +','+ targety +']');
                    return '';
                }
                tile.items.push({name:'Apple', amount:1});
            }
            worker.targetx = targetx;
            worker.targety = targety;
            worker.task = 'fetchitem';
            worker.targetitem = 'Apple';
            //console.log(worker.name +' is to get '+ worker.targetitem +' at ['+ worker.targetx +','+ worker.targety +'] for building at ['+ b.x +','+ b.y +']');
            return worker;
        }
    };
    return b;
}