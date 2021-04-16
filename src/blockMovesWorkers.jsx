/*  blockMovesWorkers.jsx
    Handles blocks that have moving workers on the screen, which can move items arund on the map
    For the game Settlers & Warlords
*/

import {game} from "./game.jsx";
import {imageURL} from "./App.js";

function ManhattanDistance(x1,y1,x2,y2) {
    // Computes a manhattan distance between two points
    if(typeof(x1)!=='number' || isNaN(x1)) {
        console.log('Error in ManhattanDistance(): x1 is not a valid number');
        return 1;
    }
    if(typeof(y1)!=='number' || isNaN(y1)) {
        console.log('Error in ManhattanDistance(): y1 is not a valid number');
        return 1;
    }
    if(typeof(x2)!=='number' || isNaN(x2)) {
        console.log('Error in ManhattanDistance(): x2 is not a valid number');
        return 1;
    }
    if(typeof(y2)!=='number' || isNaN(y2)) {
        console.log('Error in ManhattanDistance(): y2 is not a valid number');
        return 1;
    }
    return Math.abs(x1-x2) + Math.abs(y1-y2);
}


export const blockMovesWorkers = state => ({
    targetId: -1,       // This is the block we're currently working to send a tool to (or from). We'd store the block itself, but it'd
                        // be only a copy here. We need to access the actual target later on
    travelCounter:  0,  // Shows progress of travelling to the other block
    travelDistance: 0,  // How far we have to go, in total
    travelDirection: 0, // Either +1 or -1 to decide which way to move
    curImage: '',       // What image is used on the traveller object. This is kept here only for saving (and loading)
    startMove(targetBlock, fullImage) {
        // Check the data on the input parameters... along with parameters in this block
        if(typeof(state.tileX)!=='number' || isNaN(state.tileX)) {
            console.log('Error in BlockMovesWorker->startMove(): Source block has invalid tileX value');
            return;
        }
        if(typeof(state.tileY)!=='number' || isNaN(state.tileY)) {
            console.log('Error in BlockMovesWorker->startMove(): Source block has invalid tileY value');
            return;
        }
        if(fullImage=='') {
            console.log('Error in BlockMovesWorker->startMove(): No image provided');
            return;
        }
        if(targetBlock.id==null) {
            console.log('Error in BlockMovesWorker->startMove(): Target block has invalid ID');
            return;
        }
        if(typeof(targetBlock.tileX)!=='number' || isNaN(targetBlock.tileX)) {
            console.log('Error in BlockMovesWorker->startMove(): Destination block has invalid tileX value');
            return;
        }
        if(typeof(targetBlock.tileY)!=='number' || isNaN(targetBlock.tileY)) {
            console.log('Error in BlockMovesWorker->startMove(): Destination block has invalid tileY value');
            return;
        }
        state.targetId = targetBlock.id;
        state.travelCounter = 0;    // Reset this, just to keep bad things from happening
        state.travelDistance = ManhattanDistance(state.tileX, state.tileY, targetBlock.tileX, targetBlock.tileY);
        state.travelDirection = 1;
        state.curImage = fullImage; // This doesn't need to be modified, except when the game gets reloaded
        game.travellers.push({
            blockId: state.id,
            image: fullImage,
            x:state.tileX,
            y:state.tileY
        });
    },
    changeMoverDirection() {
        state.travelDirection = -state.travelDirection;
    },
    changeMoverImage(newImage) {
        state.curImage = newImage;
        // Also find the walker instance to update that, or else the change will never be displayed
        let walk = game.travellers.findIndex(ele=>ele.blockId===state.id);

    },
    endMove() {
        // Removes the walker object when the user is finished with it
        let walk = game.travellers.findIndex(ele=>ele.blockId===state.id);
        if(walk===-1) {
            console.log('Error in BlockMovesWorker->endMove(): Did not find walker object');
            return;
        }
        game.travellers.splice(walk, 1);
        // This was one... there could be more that was created for this. We need to clear out any others that may have been generated
        walk = game.travellers.findIndex(ele=>ele.blockId===state.id);
        let extras = 0;
        while(walk!=-1) {
            extras++;
            game.travellers.splice(walk,1);
            walk = game.travellers.findIndex(ele=>ele.blockId===state.id);
        }
        if(extras>0) {
            console.log('Warning in BlockMovesWorkers->endMove(): Removed '+ extras +' extra mover objects');
        }
        state.targetId = -1;
        state.travelCounter = 0;
        state.travelDistance = 0;
        state.travelDirection = 0;
    },
    takeStep() {
        // Handles moving the traveller one additional step
        // Returns true if this move has been completed

        // While we're here, verify all the data fields are valid numbers
        if(typeof(state.tileX)!=='number' || isNaN(state.tileX)) {
            console.log('Error in blockMovesWorkers->takeStep(): state.tileX is not a number. Value:', state.tileX);
            return false;
        }
        if(typeof(state.tileY)!=='number' || isNaN(state.tileY)) {
            console.log('Error in blockMovesWorkers->takeStep(): state.tileY is not a number. Value:', state.tileY);
            return false;
        }
        if(typeof(state.travelCounter)!=='number' || isNaN(state.travelCounter)) {
            console.log('Error in blockMovesWorkers->takeStep(): state.travelCounter is not a number. Value:', state.travelCounter);
            return false;
        }
        if(typeof(state.travelDistance)!=='number' || isNaN(state.travelDistance)) {
            console.log('Error in blockMovesWorkers->takeStep(): state.travelDistance is not a number Value:', state.travelDistance);
            return false;
        }
        if(typeof(state.travelDirection)!=='number' || isNaN(state.travelDirection)) {
            console.log('Error in blockMovesWorkers->takeStep(): state.travelDirection is not a number Value:', state.travelDirection);
            return false;
        }
        if(typeof(state.targetId)!=='number' || isNaN(state.targetId)) {
            console.log('Error in blockMovesWorkers->takeStep(): state.targetId is not a number Value:', state.targetId);
            return false;
        }

        let target = game.blocks.find(ele=>ele.id===state.targetId);
        if(typeof(target.tileX)!=='number' || isNaN(target.tileX)) {
            console.log('Error in blockMovesWorkers->takeStep(): target.tileX is not a number. Value:', target.tileX);
            return false;
        }
        if(typeof(target.tileY)!=='number' || isNaN(target.tileY)) {
            console.log('Error in blockMovesWorkers->takeStep(): target.tileY is not a number. Value:', target.tileY);
            return false;
        }

        //console.log('Working with ctr='+ state.travelCounter +',dir='+ state.travelDirection +',dis='+ state.travelDistance);
        state.travelCounter += state.travelDirection;
        if(state.travelCounter>=state.travelDistance) return true;
        if(state.travelCounter<=0) return true;

        // That was the easy part. Now to figure out where the traveler block should be placed
        let walk = game.travellers.findIndex(ele=>ele.blockId===state.id);
        if(walk===-1) {
            // This can happen when the game was just re-loaded and workers_finishLoad() wasn't called.
            // But we can make it now.
            console.log('Error in blockMovesWorkers->takeStep(): traveler object not found. Creating a new one');
            walk = game.travellers.length;
            game.travellers.push({
                blockId: state.id,
                image: state.curImage,
                x:state.tileX,
                y:state.tileY
            });
        }
        
        
        if(state.travelCounter <= Math.abs(state.tileX - target.tileX)) {
            // Still moving left (or right). Figure out which
            if(state.tileX > target.tileX) {    // target is left of source
                game.travellers[walk].x = state.tileX - state.travelCounter;
                game.travellers[walk].y = state.tileY;
            }else{      // target is right of source
                game.travellers[walk].x = state.tileX + state.travelCounter;
                game.travellers[walk].y = state.tileY;
            }
        }else{
            // Work on moving up (or down); figure out which
            if(state.tileY > target.tileY) {    // target is north of source
                game.travellers[walk].x = target.tileX;
                game.travellers[walk].y = target.tileY + (state.travelDistance - state.travelCounter);
            }else{      // target is south of source
                game.travellers[walk].x = target.tileX;
                game.travellers[walk].y = target.tileY - (state.travelDistance - state.travelCounter);
            }
        }

        return false;
    },
    distanceTo(block) {
        // Returns the distance to the other block. If the block provided is undefined, this returns 99
        if(typeof(block)==='undefined') return 99;
        return ManhattanDistance(state.tileX, state.tileY, block.tileX, block.tileY);
    },
    workers_finishLoad() {
        // This needs to be called within the block's finishLoad function
        if(state.targetId!=-1) {
            // Well, the easiest way to do this is to back up the step counter, then use our (already-made) takeStep(). Less code overall!
            if(typeof(state.curImage)==='undefined' || state.curImage=='') {
                state.curImage = imageURL+'movingEmpty.png';
            }
            game.travellers.push({
                blockId: state.id,
                image: state.curImage,
                x:state.tileX,
                y:state.tileY
            });

            if(typeof(state.travelCounter)!=='number' || isNaN(state.travelCounter)) {
                console.log('Error in blockMovesWorkers->workers_finishLoad(): state.travelCounter is not a number. Value:', state.travelCounter);
                return false;
            }
            if(typeof(state.travelDirection)!=='number' || isNaN(state.travelDirection)) {
                console.log('Error in blockMovesWorkers->workers_finishLoad(): state.travelDirection is not a number Value:', state.travelDirection);
                return false;
            }

            state.travelCounter -= state.travelDirection;
            state.takeStep();
        }
    }
});