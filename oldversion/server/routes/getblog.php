<?php
    /*  getblog.php
        Manages providing blog content to the client
        Actual content sent is based on input parameters
        For the game Settlers & Warlords
    */

    require_once("../config.php");
    require_once("../libs/common.php");
    require_once("../libs/jsarray.php");
    // I was going to process events with this request too. However, when players auto-login, it seems that two scrips are ran at the same time,
    // thus running one event twice. I'm not sure what to do about that if this scales up even more

    // Collect the message
    require_once("../getInput.php");

    // The output we send is based on input parameters
    $con = verifyInput($msg, [
        ['name'=>'blogid', 'required'=>true, 'format'=>'int']
    ], 'server/routes/getblog.php->get input');

    if($con['blogid']===0) {
        // No specific blog entry requested. Get the latest blog entry, and also general data from all blog posts
        $list = DanDBList("SELECT id,onday,title FROM sw_blog ORDER BY onday DESC;", '', [], 'server/routes/getblog.php->get all blogs');
        $recent = DanDBList("SELECT * FROM sw_blog ORDER BY onday DESC LIMIT 1;", '', [], 'server/routes/getblog.php->get most recent blog');
        die(json_encode([
            'result'  =>'success',
            'bloglist'=>$list,
            'latest'=>$recent[0]
        ]));
    }

    // Get the blog entry based on the id provided
    die(json_encode([
        'result'=>'success',
        'id'=>$con['blogid'],
        'content'=>DanDBList("SELECT content FROM sw_blog WHERE id=?;",
                             'i', [$con['blogid']], 'server/routes/getblog.php->get specific blog content')[0]['content']
    ]));
?>