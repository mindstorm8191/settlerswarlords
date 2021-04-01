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
    //      inputItems: If included, crafting should not start until inItems[] has the needed items. Call hasIngredients() to determine
    //          if the item can be crafted. If inputItems is empty or doesn't exist, it will still return true.
    // The block will also need an onhand attribute, which is an array of items slated for output. Completed crafted items will be placed here

    currentCraft:'',
    nextCraft: '',
    inItems: [],
    hasIngredients: (useWorkPoint)=>{
        // Returns true if this block has all the input items needed for the selected craft target.
        // If items are missing, this function will search neighbor blocks for what it needs
        if(state.currentCraft==='') return false;
        if(useWorkPoint && game.workPoints<=0) return false; // We need a work point, but don't have any available
        let needsList = state.craftOptions.find(e=>e.name===state.currentCraft);
        if(typeof(needsList.inputItems)==='undefined') return true; // This item doesn't have any input requirements
        if(needsList.inputItems.length===0) return true; // There's a list but it's empty... same difference

        needsList = needsList.inputItems.filter(needs=>
            state.inItems.filter(e=>e.name===needs.name).length<needs.qty
        ).map(e=>e.name);
        if(needsList.length===0) return true;
        // With our needs list, search nearby blocks for any items we can accept
        let neighbors = game.getNeighbors(state.tileX, state.tileY);
        return neighbors.some(n=>{
            // If any neighbor has an item we need, we can return true to stop searching
            // the hasItem function is helpful, but... only to a certain extent. We could pass our whole list of needed items to it,
            // but it'd only tell us if we have one of them, but not which one
            if(typeof(n.onhand)==='undefined') return false; // This block has no output list
            let slot = needsList.findIndex(e=>n.hasItem([e]));
            if(slot===-1) return false; // nope, nothing found
            // We got a hit! Move the item to this block
            state.inItems.push(n.getItem(needsList[slot]));
            return true;
        });
    },
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
            // Now we need to delete the ingredients from inItems, if there are any
            if(typeof(curCraft.inputItems)!=='undefined') {
                curCraft.inputItems.forEach(tax=>{
                    for(let i=0;i<tax.qty;i++) {
                        let slot = state.inItems.findIndex(s=>s.name===tax.name);
                        if(slot===-1) console.log('Failed to delete '. tax.name);
                        state.inItems.splice(slot,1);
                    }
                });
            }            
        }
    },
    ShowInputs: ()=>{
        // Displays all the items that this crafting needs, along with how many of each we currently have
        // Somehow all this is easier with React...
        if(state.currentCraft==='') return <p className="singleline" />;
        // Also determine if this even needs input items or not
        let needsList = state.craftOptions.find(e=>e.name===state.currentCraft);
        if(typeof(needsList.inputItems)==='undefined') return <p className="singleline" />;
        if(needsList.inputItems.length===0) return <p className="singleline" />;
        
        return (
            <>
                <p className="singleline">Items needed:</p>
                {state.craftOptions.find(e=>e.name===state.currentCraft).inputItems.map((needs, key)=>{
                    // Do we have all the items we need here? Get a count, first. Now we can compare needs.qty vs count
                    let count = state.inItems.filter(f=>f.name===needs.name).length;
                    return (
                        <p key={key} className="singleline" style={{backgroundColor:(count>=needs.qty)?'light green':'white'}}>
                            {needs.name} (have {count} of {needs.qty})
                        </p>
                    );
                })}
            </>
        );
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
                {state.craftOptions.filter(ele=>{
                    // Check this item for unlocks, to ensure we can view this item
                    if(typeof(ele.prereq)==='undefined') return true; // If it has no prereqs, just show it
                    if(ele.prereq.length===0) return true; // There's a prereqs attribute but it's empty
                    return ele.prereq.every(n=>game.unlockedItems.includes(n));
                }).map((ele,key) =>{
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