/*  ShowBlog.jsx
    A simple library to show blog content that's stored in a database
    Adding new entries will have to be managed from another method (the simplest being direct database edits)
    For the game Settlers & Warlords
*/

import React from "react";
import parse from "html-react-parser";
import { DAX } from "./DanAjax.js";

export function ShowBlog(props) {
    // Handles displaying a blog, including controls to load more content
    // prop fields - data
    //   serverURL - path to the server's blog page, that fetches information

    const [blogList, setBlogList] = React.useState([]);
    const [hasLoaded, setHasLoaded] = React.useState("no");
    const [blogSelected, setBlogSelected] = React.useState(0);

    React.useEffect(()=>{
        // Here, we need to fetch content from the server
        fetch(props.serverURL, DAX.serverMessage({blogid:0}, false))
            .then(res=>DAX.manageResponseConversion(res))
            .catch(err=>console.log(err))
            .then(data => {
                if(data.result!=='success') {
                    setHasLoaded('fail');
                    return;
                }
                // We really got two objects: one is the full list but no content, the other is a single record (with content)
                data.bloglist.find(b=>b.id===data.latest.id).content = data.latest.content;
                setBlogSelected(data.latest.id);
                setBlogList(data.bloglist);
                setHasLoaded('yes');
            });
    }, []);

    if(hasLoaded==="no") {
        return <div>Loading blog content...</div>;
    }
    if(hasLoaded==="fail") {
        return <div>Blog loading failed</div>;
    }
    return (
        <div style={props.style}>
            {blogList.map((blog,key)=>{
                if(blog.id!==blogSelected) {
                    return (
                        <p key={key} className="singleline">
                            <span
                                className="fakelink"
                                style={{fontWeight:'bold', marginRight:15}}
                                onClick={()=>{
                                    if(typeof(blog.content)==='undefined') {
                                        // This blog content hasn't been loaded yet. Fetch it from the database
                                        fetch(props.serverURL, DAX.serverMessage({blogid:blog.id}, false))
                                            .then(res=>DAX.manageResponseConversion(res))
                                            .catch(err=>console.log(err))
                                            .then(data => {
                                                if(data.result!=='success') {
                                                    console.log('Error:', data);
                                                    return;
                                                }
                                                let updated = blogList.map(bl=>{
                                                    if(bl.id===data.id) {
                                                        bl.content = data.content;
                                                    }
                                                    return bl;
                                                });
                                                setBlogList(updated);
                                            });
                                        // While that is loading, go ahead and show some kind of content until it displays
                                        blog.content = "<p>Loading...</p>";
                                    }
                                    setBlogSelected(blog.id);
                                }}
                            >
                                {blog.onday}
                            </span>
                            {blog.title}
                        </p>
                    );
                }
                return (
                    <div key={key}>
                        <p className="singleline">
                            <span style={{fontWeight:'bold', marginRight:15}}>{blog.onday}</span>
                            {blog.title}
                        </p>
                        {parse(blogList.find(b=>b.id===blogSelected).content)}
                    </div>
                );
            })}
        </div>
    );
}


