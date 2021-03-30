/*  blockHasMultipleOutputs
    Simple add-on component to allow multiple outputs to be shown
    For the game Settlers & Warlords
*/

import React from "react";

export const blockHasMultipleOutputs = state => ({
    // This is a simple add-on component, used only for dislay, allowing a mixed list of items to be grouped and tallied.
    // This component assumes the attached block has an onhand attribute, an array of items slated for output

    ShowOutputs() {
        let itemList = [];
        state.onhand.forEach(e=>{
            let tag = itemList.findIndex(f=>f.name===e.name);
            if(tag===-1) {
                itemList.push({name:e.name, amount:1});
            }else{
                itemList[tag].amount++;
            }
        });

        return (
            <div style={{marginTop:15}}>
                On Hand: {(state.onhand.length===0)?'nothing':(
                    itemList.map((e,key)=>(<p key={key} className="singleline">{e.name} x{e.amount}</p>))
                )}
            </div>
        );
    }
});