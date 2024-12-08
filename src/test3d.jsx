
// Just storage space to hold on to old code, in case I need to reference it later

function OldGame(props) {
    //This is a test bed for getting 3D rendering to work. It includes a few separate objects displaying correctly

    const [lightMode, setLightMode] = React.useState("night");

    /*
    const tileSet = minimapTiles.map((tile) => {
        return <Tiletexture key={tile.id} tilePic={tile.img} />;
    });*/
    // This is one method to load all tiles; instead of having `useLoader` on every texture and sticking it in a list, we create an array of tiletextures, each with their own texture
    // The other method is to have each individual tile call `useLoader` for its own texture

    return (
        <div id="canvas-container" style={{ height: "calc(100vh - 185px)" }}>
            <Canvas
                style={{ backgroundColor: "#202020", height: "calc(100vh - 185px)" }}
                camera={{ position: [0, 8, 0], rotation: [-Math.PI / 2.0, 0, 0] }}
            >
                {lightMode === "night" ? (
                    <>
                        <ambientLight color={"#505050"} />
                        <pointLight position={[5, 2, -1]} intensity={40} distance={12} color={"white"} />
                    </>
                ) : (
                    <ambientLight color={"#FFFFFF"} />
                )}

                <mesh>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshPhongMaterial color={"orange"} />
                </mesh>

                <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2.0, 0, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <React.Suspense fallback={<meshPhongMaterial color={"yellow"} />}>
                        {/*
                        <meshStandardMaterial map={textureSet[0]} />
                        {tileSet[0]}
                        */}
                    </React.Suspense>
                </mesh>

                <OneTile position={[-1, 0, 0]} tex={minimapTiles[1].img} />

                <mesh position={[0, 0, 1]} rotation={[-Math.PI / 2.0, 0, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <meshPhongMaterial color={"blue"} />
                </mesh>

                <mesh position={[1, 0, 0]} rotation={[-Math.PI / 2.0, 0, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <meshPhongMaterial color={"green"} />
                </mesh>

                <mesh position={[3, 0, 0]}>
                    <sphereGeometry args={[0.25, 16, 16]} />
                    <meshPhongMaterial color={"red"} />
                </mesh>

                <mesh position={[2, 0.5, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshPhongMaterial color={"white"} />
                </mesh>
                <div style={{ position: "absolute", bottom: 0, right: 0, backgroundColor: "lightgrey", padding: 5, fontWeight: "bold" }}>
                    <span
                        style={{ marginRight: 15, cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => {
                            if (lightMode === "night") {
                                setLightMode("day");
                            } else {
                                setLightMode("night");
                            }
                        }}
                    >
                        Toggle Day/Night
                    </span>
                </div>
            </Canvas>
        </div>
    );
}