<?php
    /* getmedia.php
       Provides files for the client side, bypassing CORS restrictions. This is primarily needed for textures and other media loaded within React-Three/Fiber. Note that production
       builds will not require using this method
       For the game Settlers & Warlords
    */
    
    // Start by managing CORS. All that is necessary is to permit certain sources to be used. This will be passed back in the client's
    // response, so the browser can accept it.
    /*
    if($_SERVER['HTTP_ORIGIN']=="http://localhost:3000") header('Access-Control-Allow-Origin: http://localhost:3000');
    if($_SERVER['HTTP_ORIGIN']=="http://localhost:3001") header('Access-Control-Allow-Origin: http://localhost:3001');
    if($_SERVER['HTTP_ORIGIN']=="http://localhost:80") header('Access-Control-Allow-Origin: http://localhost:80');
        */
    //sleep(5);
    header('Access-Control-Allow-Origin: http://localhost:3000');
    
    // Note that any file can be accessed this way, but it is limited to the images folder
    echo file_get_contents("img/". $_GET['file']);
?>
