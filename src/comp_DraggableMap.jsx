

import React from "react";
import { serverURL } from "./App.js";
import { DAX } from "./libs/DanAjax.js";

let hasReported = false;
let out = '';

// We need to prevent mouse drags from selecting tiles. This will be set to true when dragging starts, but not set to false by anything
// Fortunately for us, onClick fires AFTER onMouseUp
let dragFlag = false;
let oldMapX = 0;
let oldMapY = 0;

// I would have exported only the dragFlag, but Javascript seems unwilling to share simple variables. It'll have to be a function
export function clearDragFlag() {
    let lastValue = dragFlag;
    dragFlag = false;
    return lastValue;
}

export function DraggableMap(props) {
    // Presents a larger-than-screen map that can be dragged by the mouse
    // props - data
    //   styles - This gets apended to the styles of the map container
    // No other props are needed at this time
    // How to use:
    // <DraggableMap style={{width:'100%', height:'calc(100vh - 185px)'}}>
    //     Your map content goes here, as child components
    // </DraggableMap>

    // Note that, for all child components, any <img> tags must have `draggable="false"` included in its HTML parameters (not CSS)

    const [scrollPos, setScrollPos] = React.useState({ moveState: false, x: 0, y: 0, touchStartX: 0, touchStartY:0 });
    //let oldMapX;
    //let oldMapY;

    //let touchStartX = 0, touchStartY = 0;
    //let twotouchX = 0, twotouchY = 0;

    function startPan() {
        //dragFlag = true;
        oldMapX = scrollPos.x;
        oldMapY = scrollPos.y;
        setScrollPos({ ...scrollPos, moveState: true });
    }

    function continuePan(e) {
        if (!scrollPos.moveState) return;
        setScrollPos({ moveState: true, x: scrollPos.x + e.movementX, y: scrollPos.y + e.movementY });
    }

    function endPan() {
        // Check if the user has moved the map's position any. We are using within() to allow for inaccuracies in the user's clicks.
        // For example, if the user is trying to click something fast, and the mouse slides a little bit, this will still count as
        // a non-drag click
        if(!within(scrollPos.x, oldMapX, 5) || !within(scrollPos.y, oldMapY, 5)) {
            dragFlag = true;
        }
        console.log('old spot '+ oldMapX +','+ oldMapY);
        setScrollPos({ ...scrollPos, moveState: false });
    }

    function startTouchPan(e) {
        // The touch interface works slightly different than the mouse interface. It has a touch array, containing all the points of contact
        // on the device... we are only concerned with the first one. We'll need to update based on first known coordinates, though
        
        e.stopPropagation();
        e.preventDefault();

        let startX = parseInt(e.touches[0].clientX);
        let startY = parseInt(e.touches[0].clientY);
        oldMapX = scrollPos.x;
        oldMapY = scrollPos.y;

        //out = '[start: map '+ scrollPos.x +','+ scrollPos.y +', touch '+ startX +','+ startY +']';

        setScrollPos({...scrollPos, moveState: true, touchStartX: startX, touchStartY: startY});
    }

    function continueTouchPan(e) {
        
        // preventDefault and stopPropagation MUST be first. Otherwise this won't function properly
        e.preventDefault();
        e.stopPropagation();
        try {
            setScrollPos({
                ...scrollPos,
                x: scrollPos.x +(parseInt(e.touches[0].clientX) - scrollPos.touchStartX),
                y: scrollPos.y +(parseInt(e.touches[0].clientY) - scrollPos.touchStartY),
                touchStartX: parseInt(e.touches[0].clientX),
                touchStartY: parseInt(e.touches[0].clientY)
            });
        
        } catch(err) {
            // the error object usually has a message property. Pass that to the server
            fetch(
                serverURL +"/routes/reporterror.php",
                DAX.serverMessage({location:'src/comp_DraggableMap->continueTouchPan()', content: 'unknown error: '+ err.message}, false)
            )
                .then((res) => DAX.manageResponseConversion(res))
                .catch((err) => console.log(err))
                .then((data) => {});
        }
    }

    function endTouchPan(e) {
        /*
        out += '[end: map '+ scrollPos.x +','+ scrollPos.y +', touch '+ scrollPos.touchStartX +','+ scrollPos.touchStartY +']';
        fetch(
            serverURL +'/routes/reporterror.php',
            DAX.serverMessage({location:'src/comp_DraggableMap->endTouchPan->debug', content:out}, false)
        )
            .then(res=>DAX.manageResponseConversion(res))
            .catch(err => console.log(err))
            .then(data => {
                // ... umm, nothing needs to be done here
            });
        */
        if(!within(scrollPos.x, oldMapX, 5) || !within(scrollPos.y, oldMapY, 5)) {
            dragFlag = true;
        }
        setScrollPos({ ...scrollPos, moveState: false});
    }

    // The first div is a map container. The second is the actual map layer (that can be dragged). Inside that is the actual map content
    return (
        <div style={{...props.style, display:'block', position:'relative', overflow:'hidden'}}>
            <div
                style={{position:'absolute', top:scrollPos.y, left:scrollPos.x}}
                onMouseDown={startPan}
                onMouseMove={continuePan}
                onMouseUp={endPan}
                onTouchStart={startTouchPan}
                onTouchMove={continueTouchPan}
                onTouchEnd={endTouchPan}
            >
                {props.children}
            </div>
        </div>
    );
}

function within(value, target, threshhold) {
    // Returns true if the given value is close to the target value, within the threshhold. Aka 193 is near 200 +/- 10
    if (value < target - threshhold) return false;
    if (value > target + threshhold) return false;
    return true;
}
