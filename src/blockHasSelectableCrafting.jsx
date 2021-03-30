/*  blockHasSelectableCrafting.jsx
    Provides an interface to allow users to pick which item gets crafted by this block
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "./game.jsx";
import {ClickableLabel} from "./comp_localMap.jsx";

export const blockHasSelectableCrafting = state => ({
    // This object requires the target block to have a craftOptions attribute, which is an array of objects containint:
    //      name: name of the item to create
    //      craftTime: how many game ticks it will take to produce this item (tool efficiency may sway the actual production time)
    //      qty: how many items are produced when this item is done
    //      itemType: pass 'item', 'food' or 'tool' of the type of item produced here
    //      itemExtras: additional data fields based on the item type. Passed to game.createItem
    //      toolsUsable (optional): If included, will specify which tools can be used to craft this. Any other tools will not be
    //          usable. This is for when lower quality tools are not a fit for producing an item
    //      img (optional): Image to display beside the tool's name, when showing the option on the page
    // The block will also need an onhand attribute, which is an array of items slated for output. Completed crafted items will be placed here

    currentCraft:'',
    nextCraft: '',
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
            state.onhand.push(game.createItem(state, curCraft.name, curCraft.itemType, curCraft.itemExtras));
            if(state.nextCraft!=='') {
                state.currentCraft = state.nextCraft;
                state.nextCraft = '';
            }
        }
    },
    ShowCraftOptions() {
        const [curCraft, setCurCraft] = React.useState(state.currentCraft);
        const [nextCraft, setNextCraft] = React.useState(state.nextCraft);
        // React seems to not be geared for state changes outside the scope of React. We need to update the displayed content whenever
        // the game changes it
        if(nextCraft!==state.nextCraft) setNextCraft(state.nextCraft);
        if(curCraft!==state.currentCraft) setCurCraft(state.currentCraft);

        let craftColors = [
            {name:'selected', bgColor:'green'},
            {name:'next', bgColor:'blue'},
            {name:'other', bgColor: 'white'}
        ];
        return (
            <div style={{marginTop:15}}>
                <p className="singleline">Choose what to craft:</p>
                {state.craftOptions.map((ele,key) =>{
                    let mode = 'other';
                    if(curCraft===ele.name) mode = 'selected';
                    if(nextCraft===ele.name) mode = 'next';
                    return (
                        <ClickableLabel
                            key={key}
                            options={craftColors}
                            mode={mode}
                            onClick={()=>{
                                if(state.currentCraft===ele.name) return;  // no need to do all this if we're already crafting this
                                if(state.nextCraft===ele.name || state.currentCraft==='') {
                                    state.currentCraft = ele.name;
                                    state.progressBar = 0;
                                    setCurCraft(ele.name);
                                    if(state.nextCraft!=='') {
                                        state.nextCraft = '';
                                        setNextCraft('');
                                    }
                                }else{
                                    state.nextCraft = ele.name;
                                    setNextCraft(ele.name);
                                }
                            }}
                        >
                            {ele.img===''?'':(
                                <img src={ele.img} alt={ele.name} />
                            )}
                            {ele.name}
                        </ClickableLabel>
                    );
                })}
                {nextCraft===''?'':<p className="singleline">Click again to cancel current craft & begin now</p>}
            </div>
        );
    }
});