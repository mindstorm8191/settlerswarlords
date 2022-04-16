import React from "react";

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

    const [scrollPos, setScrollPos] = React.useState({ moveState: false, x: 0, y: 0 });

    function startPan() {
        setScrollPos({ ...scrollPos, moveState: true });
    }

    function continuePan(e) {
        if (!scrollPos.moveState) return;
        setScrollPos({ moveState: true, x: scrollPos.x + e.movementX, y: scrollPos.y + e.movementY });
    }

    function endPan() {
        setScrollPos({ ...scrollPos, moveState: false });
    }

    // The first div is a map container. The second is the actual map layer (that can be dragged). Inside that is the actual map content
    return (
        <div style={{...props.style, display:'block', position:'relative', overflow:'hidden'}}>
            <div
                style={{position:'absolute', top:scrollPos.y, left:scrollPos.x}}
                onMouseDown={startPan}
                onMouseMove={continuePan}
                onMouseUp={endPan}
            >
                {props.children}
            </div>
        </div>
    );
}
