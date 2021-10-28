<?php
    // globals.php
    // A simple libray to allow me to create & use game-wide global variables.
    
    // For this to work, we must assume a few things
    // 1) We have access to dancommon.php, which provides simplified functions to negotiate with the database
    // 2) We are already connected to the database before these functions are called
    // 3) There already exists a table globals, with the following properties:
    //    varname AS VARCHAR(50) - primary key
    //    varvalue AS TEXT

    function setGlobal($varname, $value) {
        // Sets (or creates) a global variable
        DanDBList("INSERT INTO sw_globals (varname, varvalue) VALUES (?,?) ON DUPLICATE KEY UPDATE varvalue=?;",
                  'sss', [$varname, $value, $value], 'server->globals.php->setGlobal()');
        /*
        danpost("INSERT INTO sw_globals (varname, varvalue) VALUES ('". $varname ."','". $value ."') ".
                "ON DUPLICATE KEY UPDATE varvalue='". $value ."';",
                'server->globals.php->setGlobal()');
        */
    }

    function getGlobal($varname) {
        // Returns the value of a given variable, or if the value isn't in the database, it will return null.
        $grab = DanDBList("SELECT varvalue FROM sw_globals WHERE varname=?;", 's', [$varname], 'server->globals.php->getGlobal()');
        if(sizeof($grab)==0) return null;
        $grab = $grab[0];
        if(!$grab) return null;  // We did not find any data on this varname; doing $grab['varvalue'] will result in an error.
        return $grab['varvalue'];
        /*
        $grab = danget("SELECT varvalue FROM sw_globals WHERE varname='". $varname ."';",
                       'server->globals.php->getGlobal()', true);
        if(!$grab) return null;
        return $grab['varvalue'];
        */
    }
?>