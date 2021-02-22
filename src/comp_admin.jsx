/* comp_admin.jsx
    handles all React components related to the admin portion of this project
    for the game Settlers & Warlords
*/

import React from "react";
import {DanInput} from "./DanInput.jsx";
import {DAX} from "./DanAjax.js";

import {serverURL} from "./App.js";

export function AdminPage(props) {
    // Handles all the admin sections
    // prop fields - data
    //      buildings - list of buildings and all the data relevant to it
    // prop fields - functions
    //      changeBuildingList - React updater function to alter the buildings list

    const [selectedBuilding, setSelectedBuilding] = React.useState({});

    function changeSingleBuilding(newBuildingData) {
        // Allows a single building to be updated. We can still process building updates deeper than this, but the actual buildings list
        // stops here. So to update the full buildings list, we swap out the new building data with the matching one in the existing list

        props.changeBuildingList(props.buildings.map(build => {
            if(build.name===newBuildingData.name) {
                return newBuildingData;
            }
            return build;
        }));
    }

    // Here, our objective is to display all buildings. We will show details to the selected building
    return (
        <div>
            {props.buildings.map((ele, key) => {
                if(ele===selectedBuilding) {
                    return (
                        <AdminBuilding
                            key={key}
                            building={ele}
                            changeSingleBuilding={changeSingleBuilding}
                        />
                    );
                }else{
                    // Display this as normal
                    return (
                        <div key={key} style={{margin:5, border:"1px black solid", cursor:'pointer'}} onClick={()=>setSelectedBuilding(ele)}>
                            {ele.name}
                        </div>
                    );
                }
            })}
        </div>
    );
}

function AdminBuilding(props) {
    // Displays information about a single building, for the admin to edit
    // prop fields - data
    //      building - full data structure for this one building, including actions and their items
    // prop fields - functions
    //      changeSingleBuilding - Allows the full building list to be updated
    
    // There's a few changes this time around
    // 1) Building fortification levels will be separate from production levels; they won't have a direct correlation. Therefore, we don't
    //      need to consider them in how the buildings upgrade
    // 2) The actions of an item are organized differently, being stored as a JSON object instead of as separate records in the database

    const [selectedLevel, setSelectedLevel] = React.useState(1);
    const [description, setDescription] = React.useState(props.building.description);
    const [levelMinWorkers, setLevelMinWorkers] = React.useState(props.building.levels[selectedLevel-1].minworkers);
    const [levelMaxWorkers, setLevelMaxWorkers] = React.useState(props.building.levels[selectedLevel-1].maxworkers);
    const [newActionName, setNewActionName] = React.useState('');
    const [actionMinWorkers, setActionMinWorkers] = React.useState(1);
    
    const [selectedAction, setSelectedAction] = React.useState(null);

    console.log(props.building);

    function addNewLevel() {
        console.log('Time to add a new level!');
    }

    function saveLevelStats(target, value) {
        console.log('Set '+ target +' to '+ value);
    }

    function changeLevel(newLevel) {
        setSelectedLevel(newLevel);
        setLevelMinWorkers(props.building.levels[newLevel-1].minworkers);
        setLevelMaxWorkers(props.building.levels[newLevel-1].maxworkers);
    }

    function addNewAction(newName) {
        // Allows the user to add a new action to this selected building

        // We will handle server contact here
        fetch(serverURL, DAX.serverMessage("adminAddBuildingAction", {buildname: props.building.name, actionname: newName}, true))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log('message conversion failure', err))
            .then(data => {
                if(data.result !== "success") {
                    console.log("Server reports failure:", data);
                    return;
                }
                
                // Now update the buildings. We were going to haul the function changeBuildingList all the way here, but we don't have
                // (or need) the full list of buildings. So, we have a convenient update function in AdminBuildings we can use instead.
                let workBuilding = props.building;
                workBuilding.actions.push({
                    name: newName,
                    inputGroup: [],
                    outputGroup: [],
                    minLevel: 1,
                    minWorkers: 1,
                    maxWorkers: 1,
                });
                props.changeSingleBuilding(workBuilding);
            });
    }

    /* So, we can't really use this; sending data to the server requires us to have the building name,a nd so we might as well
    update actions here, instead of within the AdminActions component
    function changeAction(newActionData) {
        // Allows a specific action of this building to be changed
        
        // Find the action instance in the building, and trigger it to be changed
        let workBuilding = props.building
        workBuilding.actions = workBuilding.actions.map(action => {
            if(action.name===newActionData.name) {
                return newActionData;
            }
            return action;
        });
        props.changeSingleBuilding(workBuilding);
    }//*/

    function changeActionItems(actionName, side, field, itemName, val) {
        // Changes the items for a specific action
        // actionName - name of the action that needs updating
        // side - use 'input' or 'output' to pick whether this is part of the input group or output group
        // field - use 'name' or 'amount'
        // itemName - name of the item to be updated
        // value - new value, whether it is the name or amount
        // No return value

        // Even though value can be either an int or string, the server can manage either case
        fetch(serverURL, DAX.serverMessage("adminChangeActionItem", {buildname: props.building.name, actionname: actionName, side:side, part:field, name:itemName, newvalue:val}, true))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log('response conversion failure:', err))
            .then(data => {
                if(data.result !== 'success') {
                    console.log('Server reported failure:', data);
                    return;
                }
                // Generate a new building, and update its actions
                let workBuilding = props.building;
                workBuilding.actions = workBuilding.actions.map(action => {
                    if(action.name===actionName) {
                        // Now, find the correct item to update
                        if(side === 'input') {
                            action.inputGroup = action.inputGroup.map(item => {
                                if(item.name===itemName) {
                                    // Update the correct component
                                    if(field==='name') {
                                        item.name = val;
                                    }else{
                                        item.amount = val;
                                    }
                                }
                                return item;
                            });
                        }else{
                            action.outputGroup = action.outputGroup.map(item => {
                                if(item.name===itemName) {
                                    if(field==="name") {
                                        item.name = val;
                                    }else{
                                        item.amount = val;
                                    }
                                }
                                return item;
                            });
                        }
                    }
                    return action;
                });
                // With action updates complete, we can now save the new building
                props.changeSingleBuilding(workBuilding);
            });
    }

    function newActionItem(actionName, side, itemName, amount) {
        // Allows a new item to be added to a given action
        // actionName - name of the action to apply the new item to
        // side - use 'input' or 'output' to determine which group it is for
        // itemName - name of the new item
        // amount - how much of this item to be used in this action. Usually on an hourly rate

        fetch(serverURL, DAX.serverMessage("adminNewActionItem", {buildname: props.building.name, actionname: actionName, side:side, name:itemName, amount:amount}, true))
            .then(res => DAX.manageResponseConversion(res))
            .catch(err => console.log('Response error:', err))
            .then(data => {
                if(data.result!=='success') {
                    console.log('Server reported failure:', data);
                    return;
                }

                let workBuilding = props.building;
                workBuilding.actions = workBuilding.actions.map(act => {
                    if(act.name===actionName) {
                        // Pick the correct side to modify
                        if(side==="input") {
                            // Account for any groups that are empty
                            if(act.inputGroup===null) {
                                act.inputGroup = [{name: itemName, amount:amount, isFood:0}];
                            }else{
                                act.inputGroup.push({name: itemName, amount:amount, isFood:0});
                            }
                        }else{
                            if(act.outputGroup===null) {
                                act.outputGroup = [{name: itemName, amount:amount, isFood:0}];
                            }else{
                                act.outputGroup.push({name:itemName, amount:amount, isFood:0});
                            }
                        }
                    }
                    return act;
                });
                props.changeSingleBuilding(workBuilding);
            });
    }

    return (
        <div>
            {/* Start with a list of available levels, and a chance to add a new level */}
            <div>
                <span style={{marginRight:10, fontWeight:'bold'}}>{props.building.name}</span>
                <span style={{marginRight:10}}> Levels:</span>
                {props.building.levels.map((ele,key) => (
                    <span className="fakelink" style={{marginRight:5}} key={key} onClick={()=>changeLevel(ele.devlevel)}>{ele.devlevel}</span>
                ))}
                <span className="fakelink" onClick={addNewLevel}>+</span>
            </div>

            {/* Show some stats on the selected level, for the user to edit. We should have at least one of them selected*/}
            <div>
                Description: {/*Note that the description is not dependent on level*/}
                <textarea value={description} rows={8} cols={30} onChange={(event)=>setDescription(event.target.value)} />
            </div>
            Workers: {" "}
            <DanInput
                fieldname="minWorkers"
                default={levelMinWorkers}
                onUpdate={(f,val)=>setLevelMinWorkers(val)}
                onBlur={()=>saveLevelStats('minworkers', levelMinWorkers)}
            /> to {" "}
            <DanInput
                fieldname="maxworkers"
                default={levelMaxWorkers}
                onUpdate={(f,val)=>setLevelMaxWorkers(val)}
                onBlur={()=>saveLevelStats('maxworkers', levelMaxWorkers)}
            />

            {/* Now, show some information about the actions for this building */}
            <div style={{fontWeight:'bold'}} >
                Actions
            </div>
            {props.building.actions.map((ele, key) => {
                if(ele!==selectedAction) {
                    return <div key={key} className="fakelink" onClick={()=>setSelectedAction(ele)}>{ele.name}</div>;
                }else{
                    return (
                        <AdminAction
                            key={key}
                            action={ele}
                            changeActionItems={changeActionItems}
                            newActionItem={newActionItem}
                            /*newActionItem={(action, side, name, amount)=>{
                                props.newActionItem(props.building.name, action, side, name, amount);
                            }}//*/
                        />
                    );
                }
            })}
            <DanInput
                placeholder="New Action Name"
                onUpdate={(f,val)=>setNewActionName(val)}
                onBlur={()=>{
                    // For this, we can just request a new action to be added
                    if(newActionName==='') return;
                    addNewAction(newActionName);
                }}
            />
        </div>
    );
}

function AdminAction(props) {
    // Handles displaying & interacting with an existing (selected) action
    // prop fields - data
    //      action - details about the specific action to show
    // prop fields - functions
    //      changeAction(newActionData) - Changes a specific action, updating the building
    //      changeActionItems(actionName, 'input'/'output', 'name'/'amount', itemName, newValue) - Changes data for an item listed in this action
    //      newActionItem(actionName, 'input'/'output', itemName, amount) - Adds a new item to this action
    //      There are other functions needed but have not yet been built

    const [minWorkers, setMinWorkers] = React.useState(props.action.minWorkers);
    const [maxWorkers, setMaxWorkers] = React.useState(props.action.maxWorkers);
    const [minLevel, setMinLevel] = React.useState(props.action.minLevel);
    const [workerBonus, setWorkerBonus] = React.useState(props.action.workerBonus);

    //let curItemName='';
    //let curItemQty=0;
    let working={};

    return (
        <div style={{border:'1px solid black', margin:10, padding:5}}>
            <div style={{fontWeight:'bold'}}>{props.action.name}</div>
            {/* Here would be a good place to show a description (and edit it) */}

            {/* Show the basic fields for this action */}
            <div>
                Workers: <DanInput default={minWorkers} onUpdate={(v,val)=>setMinWorkers(val)} /> to {" "}
                <DanInput default={maxWorkers} onUpdate={(f,val)=>setMaxWorkers(val)} />
            </div>
            <div>
                Min Level: <DanInput default={minLevel} onUpdate={(f,val)=>setMinLevel(val)} />
            </div>
            <div>
                Worker Bonus: <DanInput default={workerBonus} onUpdate={(f,val)=>setWorkerBonus(val)} />
            </div>

            {/* Now show the list of input items for this process */}
            <div>
                <div style={{ fontWeight:'bold'}}>Input resources:</div>
                {props.action.inputGroup === null ? (
                    ''
                ):props.action.inputGroup.map((item,key) => (
                    <div key={key}>
                        Name
                        <DanInput
                            fieldName={"InExName"+item.name}
                            default={item.name}
                            onFocus={()=>working={name:item.name, mode:'name', side:'input', value:item.name}}
                            onUpdate={(f,v)=>working.value=v}
                            onBlur={()=>{
                                // While we're here, we can determine if we have actually changed the value or not
                                if(working.value===undefined || item.name===working.value) return;
                                console.log('For '+ item.name +' well send: ', working);
                                props.changeActionItems(props.action.name, 'input', 'name', item.name, working.value)
                            }}
                        />
                        <span style={{marginRight:30}}></span>
                        Qty:
                        <DanInput
                            fieldName={"InExAmount"+item.name}
                            default={item.amount}
                            onFocus={()=>working={name:item.name, mode:'amount', side:'input', value:item.amount}}
                            onUpdate={(f,v)=>working.value=v}
                            onBlur={()=>{
                                // While we're here, we can determine if we have actually changed the value or not
                                if(working.value===undefined || item.amount===working.value) return;
                                console.log('For '+ item.name +' well send: ', working);
                                props.changeActionItems(props.action.name, 'input', 'amount', item.name, working.value);
                            }}
                        />
                    </div>
                ))}
                {/* Allow new input items to be added */}
                Name
                <DanInput
                    fieldName={"InNewName"}
                    placeholder={"New Item Name"}
                    onUpdate={(f,v)=>working.name=v}
                />
                <span style={{marginRight:30}} />
                Qty:
                <DanInput
                    fieldName={"InNewAmount"}
                    default={1}
                    onUpdate={(f,v)=>working.amount=v}
                />
                <span style={{marginRight:30}} />
                <button onClick={()=>props.newActionItem(props.action.name, 'input', working.name, working.amount)}>Add Item</button>
            </div>

            {/* That was a lot. Now we need to do the same for the output group */}
            <div>
                <div style={{fontWeight:'bold'}}>Output resources:</div>
                {props.action.outputGroup===null? (''):
                    props.action.outputGroup.map((item,key) => (
                        <div key={key}>
                            Name
                            <DanInput fieldName={"OutExName"+item.name} default={item.name}
                                onFocus={()=>working={name:item.name, mode:'name', side:'output', value:item.name}}
                                onUpdate={(f,v)=>working.value=v}
                                onBlur={()=>{
                                    if(working.value===undefined || item.name===working.value) return;
                                    props.changeActionItems(props.action.name, 'output', 'name', item.name, working.value)
                                }}/>
                            <span style={{marginRight:30}}></span>
                            Qty:
                            <DanInput fieldName={"OutExAmount"+item.name} default={item.amount}
                                onFocus={()=>working={name:item.name, mode:'amount', side:'output', value:item.amount}}
                                onUpdate={(f,v)=>working.value=v}
                                onBlur={()=>{
                                    if(working.value===undefined || item.amount===working.value) return;
                                    props.changeActionItems(props.action.name, 'output', 'amount', item.name, working.value);
                                }}
                            />
                        </div>
                    ))
                }
                {/* Also allow output items to be added */}
                Name
                <DanInput fieldName={"OutNewName"} placeholder={"New Item Name"} onUpdate={(f,v)=>working.name=v} />
                <span style={{marginRight:30}} />
                Qty:
                <DanInput fieldName={"OutNewAmount"} default={1} onUpdate={(f,v)=>working.amount=v} />
                <span style={{marginRight:30}} />
                <button onClick={()=>props.newActionItem(props.action.name, 'output', working.name,working.amount)}>Add Item</button>
            </div>
        </div>
        
    );
}