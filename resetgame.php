<?php
    // ResetGame.php
    // A script to flush the entire database, thus resetting the game to the beginning
    // Note: Do not leave this enabled on the live server! It will easily allow random people to reset the game; there
    // is no user login for this

    //Let's die using a syntax error. But just in case...
    //die();

    include_once("server/config.php");
    include_once("server/libs/common.php");

    DanDBList("DELETE FROM sw_error;", '', [], 'resetgame.php->clear all errors');
    DanDBList("DELETE FROM sw_event;", '', [], 'resetgame.php->clear all events');
    DanDBList("DELETE FROM sw_globals;", '', [], 'resetgame.php->clear all globals');
    DanDBList("DELETE FROM sw_knownmap;", '', [], 'resetgame.php->clear all known map tiles');
    DanDBList("DELETE FROM sw_map;", '', [], 'resetgame.php->clear all map tiles');
    DanDBList("DELETE FROM sw_minimap;", '', [], 'resetgame.php->clear all mini-map tiles');
    DanDBList("DELETE FROM sw_player;", '', [], 'resetgame.php->clear all players');
    DanDBList("DELETE FROM sw_traveler;", '', [], 'resetgame.php->clear all travelers');
    echo('All is done');
?>