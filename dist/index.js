import fs from "fs";
import dotenv from "dotenv";
// load env variables
dotenv.config();
// when run, this script does a few things:
// 1) pushes all newly created blogs in "/blogs" to supabase (by checking if the name exists in the supabase bucket)
// 2) check if an entry has been modified (not sure how, maybe check the obsidian modified time against supabsae upload time for the file)
// 3) if modified -> delete and upload file
// same for images
import { createClient } from "@supabase/supabase-js";
// Create a single supabase client for interacting with your database
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const uploadBlog = async (fname) => {
    console.log(`[uploadBlog()] Uploading file ${fname}...`);
    const filePath = process.env.BLOG_PATH + "/" + fname;
    const buffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_CONTENT_BUCKET_NAME)
        .upload(fname, buffer, {
        cacheControl: "3600",
        upsert: false,
    });
    if (error) {
        console.error("Failed to upload file to supabase", error);
    }
    else {
        console.log(`[uploadBlog()] Successfully uploaded file ${fname}`);
    }
};
const pushBlogs = async () => {
    console.log("[pushBlogs()]");
    // 1. get list of local .md files
    const localFiles = fs
        .readdirSync(process.env.BLOG_PATH)
        .filter((f) => f.endsWith(".md"));
    // 2. get list of files on supabase
    const supabaseFiles = await supabase.storage
        .from(process.env.SUPABASE_CONTENT_BUCKET_NAME)
        .list()
        .then((res) => res.data?.filter((fileObj) => fileObj.name.endsWith(".md")));
    if (supabaseFiles === undefined) {
        throw new Error("Failed to get supabase files");
    }
    // map name -> file obj
    const supabaseFileMap = {};
    for (const file of supabaseFiles) {
        supabaseFileMap[file.name] = new Date(file.updated_at);
    }
    // 3. for each local file,
    for (const fname of localFiles) {
        const filePath = process.env.BLOG_PATH + "/" + fname;
        const buffer = fs.readFileSync(filePath);
        // if file doesn't exist in `supabaseFileMap`, upload it
        if (!supabaseFileMap[fname]) {
            console.log(`Uploading file to supabase: ${fname}`);
            //   const { data, error } = await supabase.storage
            //     .from(process.env.SUPABASE_CONTENT_BUCKET_NAME!)
            //     .upload(fname, buffer, {
            //       cacheControl: "3600",
            //       upsert: false,
            //     });
            //   if (error) {
            //     console.error("Failed to upload file to supabase", error);
            //   }
            await uploadBlog(fname);
            continue;
        }
        // else if file exists in supabase
        // check current file's last updated time
        const stats = fs.statSync(filePath);
        const lastModifiedDate = stats.mtime;
        const supabaseDate = supabaseFileMap[fname];
        if (lastModifiedDate > supabaseDate) {
            // if file has been updated,
            // 1. delete it from supabase
            await supabase.storage
                .from(process.env.SUPABASE_CONTENT_BUCKET_NAME)
                .remove([fname]);
            // 2. reupload
            //   await supabase.storage
            //     .from(process.env.SUPABASE_CONTENT_BUCKET_NAME!)
            //     .upload(fname, buffer, {
            //       cacheControl: "3600",
            //       upsert: false,
            //     });
            //   console.log(`[pushBlogs()] Successfully reuploaded file ${fname}`);
            await uploadBlog(fname);
        }
    }
};
const uploadImage = async (fname) => {
    console.log(`[uploadImage()] Uploading image ${fname}...`);
    const filePath = process.env.IMAGE_PATH + "/" + fname;
    const buffer = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_IMAGE_BUCKET_NAME)
        .upload(fname, buffer, {
        contentType: "image/" + fname.split(".").pop(), // <- sets correct content type
        cacheControl: "3600",
        upsert: false,
    });
    if (error) {
        console.error("[uploadImage()] Failed to upload image to supabase", error);
    }
    else {
        console.log("[uploadImage()] Successfully upload image to supabase");
    }
};
const pushImages = async () => {
    console.log("[pushImages()]");
    // 1. get list of local images
    const localFiles = fs.readdirSync(process.env.IMAGE_PATH);
    // 2. get list of files on supabase
    const supabaseFiles = await supabase.storage
        .from(process.env.SUPABASE_IMAGE_BUCKET_NAME)
        .list()
        .then((res) => res.data ?? []);
    if (supabaseFiles === undefined) {
        throw new Error("Failed to get supabase files");
    }
    // map name -> file obj
    const supabaseFileMap = {};
    for (const file of supabaseFiles) {
        supabaseFileMap[file.name] = new Date(file.updated_at);
    }
    // 3. for each local file,
    for (const fname of localFiles) {
        const filePath = process.env.IMAGE_PATH + "/" + fname;
        // if it doesn't exist in `supabaseFileMap`, upload it
        if (!supabaseFileMap[fname]) {
            await uploadImage(fname);
            continue;
        }
        // else if file exists in supabase
        // check current file's last updated time
        const stats = fs.statSync(filePath);
        const lastModifiedDate = stats.mtime;
        const supabaseDate = supabaseFileMap[fname];
        if (lastModifiedDate > supabaseDate) {
            // if file has been updated,
            // 1. delete it from supabase
            await supabase.storage
                .from(process.env.SUPABASE_IMAGE_BUCKET_NAME)
                .remove([fname]);
            // 2. reupload
            await uploadImage(fname);
        }
    }
};
await pushBlogs();
await pushImages();
console.log("Upload complete");
//# sourceMappingURL=index.js.map