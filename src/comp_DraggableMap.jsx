

import React from "react";
import { serverURL } from "./App.js";
import { DAX } from "./libs/DanAjax.js";

let hasReported = false;
let out = '';

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

    //let touchStartX = 0, touchStartY = 0;
    //let twotouchX = 0, twotouchY = 0;

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

    function startTouchPan(e) {
        // The touch interface works slightly different than the mouse interface. It has a touch array, containing all the points of contact
        // on the device... we are only concerned with the first one. We'll need to update based on first known coordinates, though
        /*
        if(!hasReported) {
                // Create a full log of what data we have access to here
            if(typeof(e.touches)==='undefined') {
                out += '[start: e.touches isnt here]';
            }else{
                if(e.touches.length===0) {
                    out += '[start: e.touches is empty]';
                }else{
                    if(typeof(e.touches[0].clientX)==='undefined') {
                        out += '[start: e.touches[0].clientX isnt here]';
                    }else{
                        if(typeof(e.touches[0].clientY)==='undefined') {
                            out += '[start: e.touches[0].clientY isnt here]';
                        }else{
                            out += '[start: e.touches[0] at '+ e.touches[0].clientX +','+ e.touches[0].clientY +']';
            }   }   }   }

            if(typeof(e.originalEvent)==='undefined') {
                out += '[start: e.originalEvent isnt here]';
            }else{
                if(typeof(e.originalEvent.touches)==='undefined') {
                    out += '[start: e.originalEvent.touches isnt here]';
                }else{
                    if(e.originalEvent.touches.length===0) {
                        out += '[start: e.originalEvent.touches is empty]';
                    }else{
                        if(typeof(e.originalEvent.touches[0].clientX)==='undefined') {
                            out += '[start: e.originalEvent.touches[0].clientX isnt here]';
                        }else{
                            if(typeof(e.originalEvent.touches[0].clientY)==='undefined') {
                                out += '[start: e.originalEvent.touches[0].clientY isnt here]';
                            }else{
                                out += '[start: e.originalEvent.touches[0] at '+ e.originalEvent.touches[0].clientX +','+ e.originalEvent.touches[0].clientY +']';
            }   }   }   }   }
            // We don't want to update hasReported here. Wait until the first pass in continueTouchPan()
        }
        */
        
        let startX = parseInt(e.touches[0].clientX);
        let startY = parseInt(e.touches[0].clientY);

        out = '[start: map '+ scrollPos.x +','+ scrollPos.y +', touch '+ startX +','+ startY +']';

        setScrollPos({...scrollPos, moveState: true, touchStartX: startX, touchStartY: startY});
        e.stopPropagation();
        e.preventDefault();
    }

    function continueTouchPan(e) {
        /*
        if(!hasReported) {
                // Create a full log of what data we have access to here
            if(typeof(e.touches)==='undefined') {
                out += '[going: e.touches isnt here]';
            }else{
                if(e.touches.length===0) {
                    out += '[going: e.touches is empty]';
                }else{
                    if(typeof(e.touches[0].clientX)==='undefined') {
                        out += '[going: e.touches[0].clientX isnt here]';
                    }else{
                        if(typeof(e.touches[0].clientY)==='undefined') {
                            out += '[going: e.touches[0].clientY isnt here]';
                        }else{
                            out += '[going: e.touches[0] starts at '+ e.touches[0].clientX +','+ e.touches[0].clientY +']';
            }   }   }   }

            if(typeof(e.originalEvent)==='undefined') {
                out += '[going: e.originalEvent isnt here]';
            }else{
                if(typeof(e.originalEvent.touches)==='undefined') {
                    out += '[going: e.originalEvent.touches isnt here]';
                }else{
                    if(e.originalEvent.touches.length===0) {
                        out += '[going: e.originalEvent.touches is empty]';
                    }else{
                        if(typeof(e.originalEvent.touches[0].clientX)==='undefined') {
                            out += '[going: e.originalEvent.touches[0].clientX isnt here]';
                        }else{
                            if(typeof(e.originalEvent.touches[0].clientY)==='undefined') {
                                out += '[going: e.originalEvent.touches[0].clientY isnt here]';
                            }else{
                                out += '[going: e.originalEvent.touches[0] starts at '+ e.originalEvent.touches[0].clientX +','+ e.originalEvent.touches[0].clientY +']';
            }   }   }   }   }
            
            fetch(
                serverURL + "/routes/reporterror.php",
                DAX.serverMessage({location:'src/comp_DraggableMap->continueTouchPan()', content:out  }, false)
            )
                .then((res) => DAX.manageResponseConversion(res))
                .catch((err) => console.log(err))
                .then((data) => {
                    // ...umm, we shouldn't receive anything other than a success... if it didn't work there's not a lot we can do
                });
            hasReported = true;
        }
        */
        try {
            out += '[step: map '+ parseInt(e.touches[0].clientX) +','+ parseInt(e.touches[0].clientY) +', touch '+ scrollPos.touchStartX +','+ scrollPos.touchStartY +']';
            setScrollPos({
                ...scrollPos,
                x: scrollPos.x +(parseInt(e.touches[0].clientX) - scrollPos.touchStartX),
                y: scrollPos.y +(parseInt(e.touches[0].clientY) - scrollPos.touchStartY),
                touchStartX: parseInt(e.touches[0].clientX),
                touchStartY: parseInt(e.touches[0].clientY)
            });
            //touchStartX = parseInt(e.touches[0].clientX);
            //touchStartY = parseInt(e.touches[0].clientY);
            e.stopPropagation();
            e.preventDefault();
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
