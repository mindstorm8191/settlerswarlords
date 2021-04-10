/*  blockRequiresTools.jsx
    For any blocks that must use tools to perform work
    For the game Settlers & Warlords
*/

import React from "react";
import {game} from "./game.jsx";
import {ClickableLabel} from "./comp_localMap.jsx";
import {imageURL} from "./App.js";

export const blockRequiresTools = state => ({
    // This object requires the target block to have a toolGroups attribute, which is an array of objects containing
    //  group: general name of this group
    //  options: a list of only names of the tools that satisfy this tool slot
    //  loaded: holds the currently loaded tool. This can be set to null when building the block

    checkTools() {
        // Before starting, ensure the creator of the block actually made their toolGroups array
        if(typeof(state.toolGroups)==='undefined') {
            console.log('Error in block '+ state.name +': Missing toolGroups structure when calling checkTools()');
            return false;
        }
        // Used to determine if the given item can be crafted, based on having all the loaded tools. Returns true if work can be done
        return state.toolGroups.every(group=>{
            // Before worrying about if we can work here, attempt to get any tools we may need
            if(group.loaded===null) {
                // We don't have a tool. Request the selected tool (if there is one)
                if(group.selected!=='') {
                    let box = game.toolLocation(group.selected);
                    if(box!==-1) game.blocks[box].requestTool(state, group.selected);
                }
            }

            if(!group.required) return true; // This tool isn't required for this block
            if(group.loaded===null) return false;   // There's no tool here
            return true;
        });
    },
    useTools() {
        // Handles updating each of the tool's usage when they are used
        state.toolGroups.forEach(group => {
            if(group.loaded!==null) {
                group.loaded.endurance--;
                if(group.loaded.endurance<=0) group.loaded = null;
            }
        });
    },
    receiveTool(tool) {
        // Allows a toolbox to put a tool into this block's tools section
        // tool: The tool object (also an item) to accept

        // First, find the tool group that this tool belongs to
        let group = state.toolGroups.findIndex(group => group.options.includes(tool.name));
        if(group===-1) return false;    // No group has this tool type
        if(state.toolGroups[group].loaded!==null) return false; // We already have a tool here; don't need another (yet)
        state.toolGroups[group].loaded = tool;
        return true;
    },
    ShowTools() {
        let toolModes = [
            {name:'selected', bgColor:'green'}, // equipped, with more on the way
            {name:'lastone', bgColor:'orange'}, // equipped, but no more available
            {name:'none', bgColor:'red'},       // not equipped, none available
            {name:'notused', bgColor:'white'},  // not equipped, but at least one available
            {name:'disabled', bgColor:'grey'}   // not available for this job
        ];

        // We want to apply tool images to all the tools, but without requiring the block using this module to provide it
        // Tool options are also listed as an array of strings (instead of objects).
        // Therefore, we will use this (local) lookup structure to pick up an image to display
        let toolImages = [
            {name: 'Flint Knife',   image: imageURL+"item_FlintKnife.png"},
            {name: 'Flint Stabber', image: imageURL+"item_FlintStabber.png"}
        ];

        return (
            <div style={{marginTop:10}}>
                Select a tool
                {state.toolGroups.map((group,key) => (
                    <div key={key}>
                        <p className="singleline">
                            {group.group}: loaded={group.loaded===null?'none':group.loaded.name}
                        </p>
                        <div>
                            {/*Provide a no-tool mode*/}
                            <ClickableLabel 
                                options={toolModes}
                                mode={group.selected===''?'selected':'notused'}
                                onClick={cur=>{
                                    group.selected = '';
                                }}
                            >
                                None
                            </ClickableLabel>
                            {group.options.filter(choice=>{
                                // Before providing each tool, make sure this has been unlocked first
                                return game.unlockedItems.includes(choice);
                            })
                            .map((choice,key2) => {
                                // note that choices is only a string; no object here
                                let toolMode = 'none';
                                if(group.loaded!==null && group.loaded.name===choice) {
                                    toolMode = 'selected';
                                    if(game.toolCount(choice)===0) toolMode = 'lastone';
                                }else{
                                    if(game.toolCount(choice)!==0) toolMode = 'notused';
                                }
                                return (
                                    <ClickableLabel
                                        key={key2}
                                        options={toolModes}
                                        mode={toolMode}
                                        onClick={cur=>{
                                            group.selected = choice;
                                        }}
                                    >
                                        {!toolImages.some(e=>e.name===choice)?'':(
                                            <img src={toolImages.find(e=>e.name===choice).image} alt={choice} />
                                        )}
                                        {choice}
                                    </ClickableLabel>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )
    }
});