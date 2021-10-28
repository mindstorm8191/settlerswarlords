/*  blockHasOuputsPerInput.jsx
    Handles crafting items that are dependent on single input items
    For the game Settlers & Warlords
*/

import {game} from "./game.jsx";

// This will not really be a display module, but one to handle 'back-end' tasks

export const blockHasOutputsPerInput = state => ({
    inItems: [],    // Allows us to hold multiple input items, if sent to this block. We will generally only focus on the first element of this list
    searchForItems() {
        // Looks for items in neighboring blocks to put here. Returns true if one was loaded (the block can then use work points), or false if not
        return game.getNeighbors(state.tileX,state.tileY).some(edge => {
            let collect = edge.getItemFrom(state.outputItems.map(e=>e.name));
            if(typeof(collect)==='undefined' || collect===null) return false;
            game.moveItem(collect.id, state.id);
            state.inItems.push(collect);
            return true;
        });
    },
    getCraftPercent() {
        // Returns the percent of crafting that is completed for the current task
        if(state.inItems.length===0) return 0;
        let stats = state.outputItems.find(e=>e.name===state.inItems[0].name);
        if(typeof(stats)==='undefined') {
            console.log('block '+ state.name +' in blockHasOutputsPerInput->getCraftPercent(): item '+ state.inItems[0].name +' not handled');
            return 0;
        }
        return Math.floor((state.progressBar / stats.craftTime)*100);
    },
    processCraft(efficiency) {
        // Updates to handle crafting the selected item
        if(state.inItems.length===0) return;    // We have nothing to work on...
        let stats = state.outputItems.find(e=>e.name===state.inItems[0].name);
        if(typeof(stats)==='undefined') {
            console.log('block '+ state.name +' in blockHasOutputsPerInput: item '+ state.inItems[0].name +' not handled');
            return;
        }
        if(typeof(efficiency)==='undefined') efficiency = 1;
        // Now we can progress the crafting
        state.progressBarMax = stats.craftTime;
        state.progressBar += efficiency;

        if(state.progressBar>=stats.craftTime) {
            state.progressBar -= state.progressBarMax;
            stats.output.forEach(ele=>{
                for(let i=0; i<ele.qty; i++) {
                    state.onhand.push(
                        game.createItem(state.id, ele.name, 'item', {})
                    );
                }
            });
            // Don't forget to delete the input item!
            game.deleteItem(state.inItems[0].id);
            state.inItems.splice(0,1);
        }
    }
});