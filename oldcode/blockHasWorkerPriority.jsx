/*  blockHasPriority.jsx
    Provides an add-on section to allow users to adjust the priority of a block
    for the game Settlers & Warlords
*/

import React from "react";
import {game} from "./game.jsx";
import {imageURL} from "./App.js";

function getNextPriority() {
    if(game.blocks.length===0) return 1;    // If there aren't any buildings, set the first priority

    // Finding the last priority level will be difficult when we have some buildings that don't have priority
    for(let i=game.blocks.length-1; i>=0; i--) {
        if(typeof(game.blocks[i].priority)!=='undefined') {
            return game.blocks[i].priority+1;
        }
    }
    // We didn't find any blocks with priority...
    return 1;
}

export const blockHasWorkerPriority = state =>({
    priority: getNextPriority(),
    changePriority(shift) {
        let newValue = Math.max(0, state.priority+shift);
        state.priority = newValue
        game.blocks.sort(game.sortBlocks);
    },
    ShowPriority(hooks) {
        // Since this is rendered as a component now (instead of as a function), we can use hooks without issue
        const [curPriority, setCurPriority] = React.useState(state.priority);
        return (
            <div>
                Priority:
                <img
                    src={imageURL+'arrowleft.png'}
                    alt="-1"
                    style={{cursor:'pointer'}}
                    onClick={()=>{
                        state.changePriority(-1);
                        setCurPriority(Math.max(0, curPriority-1));
                    }}
                />
                <span style={{marginLeft:5, marginRight:5}}>{curPriority}</span>
                <img
                    src={imageURL+'arrowright.png'}
                    alt="+1"
                    style={{cursor:'pointer'}}
                    onClick={()=>{
                        state.changePriority(1);
                        setCurPriority(curPriority+1);
                    }}
                />
            </div>
        );
    }
});