/*  DanCarousel.jsx
    A React element to show slides, transitioning between each one after a period of time
    Built for the game Settlers & Warlords
*/

import React from "react";

export function DanCarousel(props) {
    // Handles displaying a series of pictures in a cyclic manner
    // prop fields - child elements: each individual slide of the carousel to show
    // prop fields - styles: This will be applied to the container element of the slide show. Individual styles can be applied to the
    //      child elements to affect each child
    // prop fields - data:
    //      displayTime - int; how long each slide is displayed for, in milliseconds
    //      transitionTime - int; how long it takes to transition between each slide, in milliseconds
    //      showProgressBar - bool; set to true to show a progress bar across the bottom. It will increase in length as the selected frame sits,
    //          and then decrease as the frame slides over

    //    entries - array of output content to display

    const [tick, setTick] = React.useState(0);
    const [mode, setMode] = React.useState(0);
    const [offset, setOffset] = React.useState(0);
    const [display, setDisplay] = React.useState(typeof props.startFrame === "undefined" ? 0 : props.startFrame);
    const [slidePosition, setSlidePosition] = React.useState(0);
    let displayTime = typeof props.displayTime === "undefined" ? 6000 : props.displayTime;
    let transitionTime = typeof props.transitionTime === "undefined" ? 2000 : props.transitionTime;
    let width = typeof props.style.maxWidth === "undefined" ? 500 : props.style.maxWidth;

    const slides = React.Children.toArray(props.children);
    // Transitions will work fine like this, except for the last frame. It will slide over to darkness, then instantly jump to the first frame.
    // To fix this, we will add the first frame at the end of the array, and still instantly jump to the first frame once we reach that frame.
    slides.push(slides[0]);

    // tick will actually contain the progress needed between sessions... we should probably reset it once it reaches the next 'frame'

    let carouselStart;
    let carouselRootTimeout = null;
    let isRunning;

    React.useEffect(() => {
        // I was going to set up a setInterval loop, but we should keep this running using requestAnimationFrame()
        if (carouselRootTimeout === null) {
            isRunning = true;
            carouselStart = new Date().valueOf();
            window.requestAnimationFrame(CarouselTick);
        }
        return ()=> {
            isRunning = false;
            console.log('Carousel unmounted');
        }
    }, []);

    function CarouselTick() {
        // Do work
        let curTime = new Date().valueOf();
        let fullFrame = displayTime + transitionTime; // we will need to update this later; for now, we will use constants
        
        // `tick` might be useful to show progress between slides, but won't help us (directly) to transition between them. We still need
        // to use curTime
        
        let elapsed = (Math.floor(curTime - carouselStart) % fullFrame) - displayTime;
        if (elapsed > 0) {
            // This is the transitioning period
            setOffset((elapsed / parseFloat(transitionTime)) * width);
            setSlidePosition(((transitionTime-elapsed)/parseFloat(transitionTime)) * width);
        } else {
            setOffset(0);
            // We could use elapsed for the slider value, but it will be hard. It counts up from a big negative value, until it reaches zero
            let slideTime = Math.floor(curTime - carouselStart) % fullFrame;
            setSlidePosition((slideTime / parseFloat(displayTime)) * width);
            //console.log(slideTime);
        }
        setDisplay(Math.floor((curTime - carouselStart) / fullFrame));

        // Time management will work differently than in the game. We won't rely on a fixed 20 frames per second rate. Instead, we can run
        // this cycle as fast as the browser will allow
        if(isRunning) window.requestAnimationFrame(CarouselTick);
    }

    return (
        <div style={{ position: "relative", overflow: "hidden", ...props.style, width: width, height: 400 }}>
            {slides.map((slide, key) => (
                <div
                    key={key}
                    style={{
                        display: "block",
                        position: "absolute",
                        top: 0,
                        left: (key - (display % (slides.length-1))) * width - offset,
                        // for slides.length, don't forget to ignore the last frame, since it's also the first
                        width: 460,
                        backgroundColor: "white",
                    }}
                >
                    {slide}
                </div>
            ))}
            {props.showProgressBar===true?(
                <div style={{display:'block', position:'relative', backgroundColor:"grey", width:width, height:10}}>
                    {/* So, I guess this progress bar will be across the top, instead of the bottom like I had planned.
                        I'll let someone else figure out how to fix that! */}
                    <div style={{display:'block', position:'absolute', top:0, left:0, width:slidePosition, height:10, backgroundColor:'black'}} />
                </div>
            ):''}
        </div>
    );
}


