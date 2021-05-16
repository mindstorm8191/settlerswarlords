/*  blockDeletesWithItems.jsx
    Add-on block that generates a recycler when a block is deleted. This allows the player to keep items they want, or give up any they don't want
    For the game Settlers & Warlords
*/

import React from "react";
import { game } from "./game.jsx";
import { Recycler } from "./block_recycler.jsx";

export const blockDeletesWithItems = state => ({
    ShowDeleteButton: props => {
        // Shows the delete button, making it easy to delete this block

        return (
            <p className="singleline">
                <button onClick={()=>{state.delete(props.onChangeTile)}}>Delete</button>
            </p>
        );
    },

    delete: changeTileFn => {
        // Before we delete, we need to collect the various items from different sources.
        // Most blocks have an onhand list for outputs... but not all
        // Some blocks also have an inItems list
        // Tools will also have items for each tool slot
        // There may be additional places where items are stored. We will request the rest from the block itself
        let itemsPile = [];
        if(typeof(state.onhand)!=='undefined') itemsPile.push(...state.onhand);
        if(typeof(state.inItems)!=='undefined') itemsPile.push(...state.inItems);
        if(typeof(state.toolGroup)!=='undefined') {
            for(let i=0; i<state.toolGroup.length; i++) {
                if(state.toolGroup[i].loaded!==null) itemsPile.push(state.toolGroup[i].loaded);
            }
        }
        if(typeof(state.otherItemsAtDelete)!=='undefined') {
            let extras = state.otheritemsAtDelete();
            if(extras.length>0) itemsPile.push(extras);
        }

        // We'll need these later
        let gameIndex = game.blocks.findIndex(e=>e.id===state.id);
        let tile = game.tiles.find(e=>e.x===state.tileX && e.y===state.tileY);

        // Now for the decision
        if(itemsPile.length>0) {
            // There's at least something to keep here. Create the recycler
            game.blocks.splice(gameIndex, 1);
            let recycler = Recycler(tile, itemsPile, state.priority);
            game.blocks.push(recycler);
            tile.buildid = recycler.id;
            tile.buildimage = recycler.image;
        }else{
            // There are no items here at all. We can delete this without issues
            game.blocks.splice(gameIndex, 1);
            tile.buildid = 0;
            game.updateReact([...game.tiles]);
            // So, even though we have updated the full map now, the selected item in React is still not updated.
            // Unfortunately, the only means to update this is to prop-drill a function (handle) to this location.
            changeTileFn(tile);
        }
    }
});