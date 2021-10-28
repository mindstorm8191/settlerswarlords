/*  block_leanto.jsx
    Holds all the code related to the lean-to building
    For the game Settlers & Warlords (version 6)
*/

import React from "react";
import {imageURL} from "./App.js";
import {game} from "./game.jsx";
import {blockHasWorkerPriority} from "./blockHasWorkerPriority.jsx";

export function LeanTo(mapTile) {
    // Let's start by creating our object first
    if(mapTile.landtype!==5) return 'wronglandtype';
    let b = {
        id: game.getNextBlockId(),
            // We can pick a unique ID by looking at the last building, and going +1 of that - as long as the list isn't empty
            // This will only work until we prioritize buildings (to use work points correctly)
        name: 'Lean-To',
        descr: `Before food, even before water, one must find shelter from the elements. It is the first requirement for survival;
                for the elements, at their worst, can defeat you faster than anything else. Consisting of a downed branch with leaves
                on top, this is fast & easy to set up, but wont last long in the elements itself.`,
        usage: `Needs time to set up, then can be used for a time before it must be rebuilt`,
        image: imageURL+'leanto.png',
        mode: 'building',
        progressBar: 0,
        progressBarMax: 120,
        progressBarColor: 'brown',
        tileX: mapTile.x,
        tileY: mapTile.y,
        possibleOutputs: ()=> [],  // This has no outputs
        willOutput: n => false,
        hasItem: name => false, // This doesn't return any items... so none of these functions will do anything
        getItem: name => null,  
        getItemFrom: list => null,
        willAccept: item=>false,
        takeItem: o => false,
        fetchItem: itemId=>null,
        destroyItem: itemId=>false,
        workState: ()=>{
            // Returns a string representing the status of work for this block. May be one of:
            // 'needs work': This block is missing components that prevent it from functioning fully
            // 'has work': This block has work that can be done, but isn't necessary for its function
            // 'no work': There is no work that can be done at this block
            return (b.mode==='building')?'needs work':'no work';
        },
        getSubtask: ()=> {
          // Returns a subtask for this worker to work on
          // Since this only needs construction, have any workers work on site
          return "craft";
        },
        update: () => {
            if(b.mode==='building') {
                /* We will no longer do work here directly; it will be handled by the worker. Decay of the building, however, will happen
                   automatically... we will likely have an acceptWork function in all blocks now
                if(game.workPoints<=0) return;
                b.progressBar++;
                game.workPoints--;
                if(b.progressBar>=120) {
                    b.mode = 'in use';
                    b.progressBar = 300;
                    b.progressBarMax = 300;
                    b.progressBarColor = 'black';
                }*/
            }else{
                b.progressBar--;
                if(b.progressBar<=0) {
                    b.mode = 'building';
                    b.progressBar = 0;
                    b.progressBarMax = 120;
                    b.progressBarColor = 'brown';
                }
            }
        },
        advanceCraft: () => {
            // A worker has put their effort into this building. Time to get some progress done
            // Start by checking this block's current mode
            if(b.mode==='building') {
                b.progressBar++;
                if(b.progressBar>=120) {
                    b.mode = 'in use';
                    b.progressBar = 300;
                    b.progressBarMax = 300;
                    b.progressBarColor = 'black';
                }
            }
        },
        SidePanel: ()=>{
            // All buildings show their description & usage at the top automatically
            const [pickingWorker, setPickingWorker] = React.useState(0);
            return (
                <>
                    <div>Mode: {b.mode}</div>
                    <div>Counter: {b.progressBar}</div>
                    <p className="singleline" style={{fontWeight:'bold'}}>Tasks</p>
                    <p className="fakelink singleline" onClick={()=>setPickingWorker(1-pickingWorker)}>Build & Maintain</p>
                    {pickingWorker===1?(
                        <>
                            <p className="singleline">Choose a worker</p>
                            {game.workers.length===0?(
                                <p className="singleline">(You have no workers)</p>
                            ):game.workers.map((worker,key)=>(
                                <p key={key}
                                   className="fakelink singleline"
                                   onClick={()=>{
                                       // Now the magic begins!
                                       game.assignWorker(worker.name, b.id, 'Build & Maintain');
                                       // Later, we will set if this should be done first, next or last
                                   }}
                                >{worker.name} ({worker.status})</p>
                            ))}
                        </>
                    ):('')}
                </>
            );
        },
        save: ()=>{
            // Saves this block's content to the server
            // We really only need to store the mode (1 of 2) and progress bar value
            // Note the block's name & id are already saved
            return {
                priority: b.priority,
                mode: (b.mode==='building')?0:1,
                progress: b.progressBar
            };
        },
        load: content =>{
            b.priority = parseInt(content.priority);
            b.progressBar = parseInt(content.progress);
            b.mode = (parseInt(content.priority)===0)?'building':'in use';
        }
    }
    return Object.assign(b, blockHasWorkerPriority(b));
}