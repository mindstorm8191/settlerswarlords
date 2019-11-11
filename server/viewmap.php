<?php
    // ViewMap.php
    // A stand-alone script to view the map of the known world, and where players are located

    require_once("common.php");  // This handles connecting to our database for us

    // Before getting started, we need to determine the lower limits of the world map.
    $bounds = danget("SELECT ".
                     "    (SELECT x FROM sw_map ORDER BY x ASC LIMIT 1) AS lowx, ".
                     "    (SELECT y FROM sw_map ORDER BY y ASC LIMIT 1) AS lowy, ".
                     "    (SELECT x FROM sw_map ORDER BY x DESC LIMIT 1) AS highx, ".
                     "    (SELECT y FROM sw_map ORDER BY y DESC LIMIT 1) as highy; ",
                     'viewmap.php->get boundaries');
    
    // Now, we need to run through all elements, and plot them on a map
    //$map = danqueryajax("SELECT x,y,owner,biome FROM sw_map ORDER BY y,x;",
    //                    'viewmap.php->get full map');
    $map = danquery("SELECT x,y,owner,biome FROM sw_map ORDER BY y,x;",
                    'viewmap.php->get full map');
    $ele = mysqli_fetch_assoc($map);
    echo `
        <html>
            <body>
                <div style="width:`. (($bounds['highx']-$bounds['lowx'])*20) .`px; height:`. (($bounds['highy']-$bounds['lowy'])*20) .`px; position:relative">`;
                    while($ele) {
                        echo '<div style="display:block; position:absolute; left:'. (($ele['x']-$bounds['lowx'])*20) .'px; top:'. (($ele['y']-$bounds['lowy'])*20) .'px; width:20px; height:20px">';
                        if($ele['owner']==0) {
                            echo $ele['biome'];
                        }else{
                            echo '<span style="color:orange; font-weight:bold;">'. $ele['owner'] .'</span>';
                        }
                        echo '</div>';
                        $ele = mysqli_fetch_assoc($map);
                    }
    echo `      </div>
            </body>
        </html>`;
?>