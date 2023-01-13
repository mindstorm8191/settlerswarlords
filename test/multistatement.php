<?php
    /* multistatement.php
        A test, to determine if I can update two records at once
    */

    include_once("../server/config.php");
    include_once("../server/common.php");

    $db->query("INSERT INTO sw_error (id, happens) VALUES (11393, NOW()), (11394, NOW()) ON DUPLICATE KEY UPDATE happens=VALUES(happens);");
    echo mysqli_error($db);
?>
