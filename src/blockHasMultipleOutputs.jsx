/*  blockHasMultipleOutputs.jsx
    Simple add-on component to allow multiple outputs to be shown
    For the game Settlers & Warlords
*/

import React from "react";

export const blockHasMultipleOutputs = state => ({
    // This is a simple add-on component, used only for dislay, allowing a mixed list of items to be grouped and tallied.
    // This component assumes the attached block has an onhand attribute, an array of items slated for output
    dropList: [], // Holds names of any items that the user has elected to drop

    ShowOutputs(props) {
        // prop fields - data
        //      canDrop - List of items that can be dropped by this block. These are still displayed, and will take worker points
        //          to release from this block's inventory
        let itemList = [];
        state.onhand.forEach(e=>{
            let tag = itemList.findIndex(f=>f.name===e.name);
            if(tag===-1) {
                itemList.push({name:e.name, amount:1});
            }else{
                itemList[tag].amount++;
            }
        });
        // Also include any items on the drop list
        state.dropList.forEach(e=>{
            itemList.push({name:e, amount:'(dropped)'});
        });
        let canDrop = props.canDrop;
        if(typeof(canDrop)==='undefined') canDrop = false;

        return (
            <div style={{marginTop:15}}>
                On Hand: {(state.onhand.length===0)?'nothing':(
                    itemList.map((e,key)=>{
                        return (
                            <p key={key} className="singleline">
                                {e.name} x{e.amount}
                                {!canDrop?'':state.dropList.includes(e.name)?(
                                    <button onClick={()=>{
                                        let slot = state.dropList.findIndex(f=>f===e.name);
                                        if(slot===-1) return console.log('Error: Item '+ e.name +' not found in drop list');
                                        state.dropList.splice(slot,1);
                                    }}>Keep</button>
                                ):(
                                    <button onClick={()=>{
                                        state.dropList.push(e.name);
                                    }}>Drop</button>
                                )}
                            </p>
                        );
                    })
                )}
            </div>
        );
    }
});