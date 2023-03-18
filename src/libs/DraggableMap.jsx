/*  DraggableMap
    Offers a draggable interface, where images or other DOM elements can be added to a map. This interface works with mouse and touch
    Created for Settlers & Warlords; can be used in other projects too
    Copywright 2023 by Daniel Bartsch

    How to use
    <DraggableMap style={{width:'100%', height:'100vh'}}>
        Your map content goes here, as child components
    </DraggableMap>
    Additional style settings can be passed in to control the container element

    
    Note that for all child components, any <img> tags must have `draggable="false" included in its HTML parameters - not CSS. For example,
    <img src="myimage" draggable="false" style={{border:1}} />

    Elements within <DraggableMap> will have their onClick function called at the end of any scrolling action, whether the map was moved or
    not. If you want to only accept clicks on non-move events, use clearDragFlag like this:
    <img src="myimage" onClick={()=>{
        if(clearDragFlag()===true) return;
        // do your work here
    }} />
    Note that calling clearDragFlag() will also clear the drag state.

    An optional prop field of threshhold can be passed in. This defines the minimum mouse movement required for the map to be considered
    moving verses clicked on. For example, a slight movement of the mouse when a user is clicking on something will still count as a click,
    not a move. The default value is 2; this can be set to 0 if desired.

    Known Bugs
    1) If the user scrolls too fast near the edge of the map, the map will be in a state where any touch on the map causes it to scroll
        even further off the screen. A work-around is in place so that, if the user clicks outside the map, the map scrolling will stop
        so that normal scrolling can resume.
*/

import React from "react";

// We need to prevent mouse drags from selecting tiles. This will be set to true when dragging starts, but not set to false by anything
// Fortunately for us, onClick fires AFTER onMouseUp
let dragFlag = false;
let oldMapX = 0;
let oldMapY = 0;

// I was previously using event.movementX & Y to determine mouse movement. However, this doesn't behave correctly in Chrome (sometimes
// they fix it, sometimes it breaks), as it was moving slower than the mouse, unless moving slowly. Now I am recording the start
// position of the cursor
let dragStartX = 0;
let dragStartY = 0;

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
    //   threshhold - How much mouse movement is considered movement of the map. This will be set to 2 if not provided.
    // No other props are needed at this time

    // Note that, for all child components, any <img> tags must have `draggable="false"` included in its HTML parameters (not CSS)

    const [scrollPos, setScrollPos] = React.useState({ moveState: false, x: 0, y: 0, touchStartX: 0, touchStartY:0 });
    let threshhold = (typeof(props.threshhold)==='undefined')?2:(props.threshhold<0)?0:props.threshhold;

    function startPan(e) {
        //dragFlag = true;
        oldMapX = scrollPos.x;
        oldMapY = scrollPos.y;
        setScrollPos({ ...scrollPos, moveState: true });
        dragStartX = e.clientX - scrollPos.x;
        dragStartY = e.clientY - scrollPos.y;
    }

    function continuePan(e) {
        if (!scrollPos.moveState) return;
        setScrollPos({ moveState: true, x: e.clientX -dragStartX, y: e.clientY -dragStartY});
    }

    function endPan(e) {
        // Check if the user has moved the map's position any. We are using within() to allow for inaccuracies in the user's clicks.
        // For example, if the user is trying to click something fast, and the mouse slides a little bit, this will still count as
        // a non-drag click
        if(!within(scrollPos.x, oldMapX, threshhold) || !within(scrollPos.y, oldMapY, threshhold)) {
            dragFlag = true;
        }
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
        setScrollPos({
            ...scrollPos,
            x: scrollPos.x +(parseInt(e.touches[0].clientX) - scrollPos.touchStartX),
            y: scrollPos.y +(parseInt(e.touches[0].clientY) - scrollPos.touchStartY),
            touchStartX: parseInt(e.touches[0].clientX),
            touchStartY: parseInt(e.touches[0].clientY)
        });
    }

    function endTouchPan(e) {
        if(!within(scrollPos.x, oldMapX, threshhold) || !within(scrollPos.y, oldMapY, threshhold)) {
            dragFlag = true;
        }
        setScrollPos({ ...scrollPos, moveState: false});
    }

    // Convert the child elements to an array, so we can single out any FixedPositionChild elements
    const children = React.Children.toArray(props.children);
    const normalChildren = children.filter(c => {
        if(typeof(c.type)==='string') return true; // This is a normal DOM element; treat it as a moveable item
        if(typeof(c.type)==='undefined') return true; // Normal text not contained in a DOM element should be treated as a DOM element
        return c.type.name !== 'FixedPositionChild';
    });
    const fixedChildren = children.filter(c => {
        if(typeof(c.type)==='string') return false; // This can't be one of the FixedPositionChild elements
        if(typeof(c.type)==='undefined') return false;
        return c.type.name === 'FixedPositionChild';
    });


    // The first div is a map container. The second is the actual map layer (that can be dragged). Inside that is the actual map content
    return (
        <div
            style={{...props.style, display:'block', position:'relative', overflow:'hidden'}}
            onClick={()=>{
                // If users scroll too fast onto the edge of a map, there is a bug that causes the map to scroll every time the cursor
                // re-enters the map, thus causing the map to only slide further off screen. This is a temporary fix, to where the user
                // can click outside the map to stop the map from continuing to scroll
                setScrollPos({...scrollPos, moveState:false});
            }}
        >
            <div
                style={{position:'absolute', top:scrollPos.y, left:scrollPos.x}}
                onMouseDown={startPan}
                onMouseMove={continuePan}
                onMouseUp={endPan}
                onTouchStart={startTouchPan}
                onTouchMove={continueTouchPan}
                onTouchEnd={endTouchPan}
            >
                {normalChildren}
            </div>
            {fixedChildren.length>0?(fixedChildren):('')}
        </div>
    );
}

export function FixedPositionChild(props) {
    return <>{props.children}</>
}

function within(value, target, threshhold) {
    // Returns true if the given value is close to the target value, within the threshhold. Aka 193 is near 200 +/- 10
    if (value < target - threshhold) return false;
    if (value > target + threshhold) return false;
    return true;
}
