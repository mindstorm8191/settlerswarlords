/*  blockHasSelectableCrafting.jsx
    Provides an interface to allow users to pick which item gets crafted by this block
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "./game.jsx";
import {imageURL} from "./App.js";
import {ClickableLabel} from "./comp_localMap.jsx";

export const blockHasSelectableCrafting = state => ({
    currentCraft:'',
    progressCraft(efficiency) {
        // Used in block.update. Handles making progress on the currently selected item to craft
        // efficiency: How much progress to make on this. Use 1 if not using tools
        let curCraft = state.craftOptions.find(e=>e.name===state.currentCraft);
        if(!curCraft) {
            console.log('Error in blockHasSelectableCrafting.ProgressCraft: attempting to craft '+ state.currentCraft +' but its not in the craftOptions list');
            return;
        }
        state.progressBarMax = curCraft.craftTime;
        state.progressBar += efficiency;
        if(state.progressBar>=state.progressBarMax) {
            state.progressBar -= curCraft.craftTime;
            state.onhand.push(game.createItem(state, curCraft.name, 'item'));
        }
    },
    ShowCraftOptions() {
        const [curCraft, setCurCraft] = React.useState(state.currentCraft);
        let craftColors = [
            {name:'selected', bgColor:'green'},
            {name:'other', bgColor: 'white'}
        ];
        function updateCraft(newItem) {
            if(state.currentCraft===newItem) return;
            state.currentCraft = newItem;
            state.progressBar = 0;
            setCurCraft(newItem);
        }
        return (
            <div style={{marginTop:15}}>
                <p className="singleline">Choose what to craft:</p>
                {state.craftOptions.map((ele,key) =>(
                    <ClickableLabel
                        key={key}
                        options={craftColors}
                        mode={curCraft===ele.name?'selected':'other'}
                        onClick={()=>updateCraft(ele.name)}
                    >
                        {ele.img===''?'':(
                            <img src={ele.img} alt={ele.name} />
                        )}
                        {ele.name}
                    </ClickableLabel>
                ))}
            </div>
        );
    }
});