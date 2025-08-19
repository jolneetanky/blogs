import fs from "fs";
import dotenv from "dotenv";

// load env variables
dotenv.config();

// same for images
import { createClient } from "@supabase/supabase-js";
import type { FileObject } from "@supabase/storage-js";

// Create a single supabase client for interacting with your database
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const uploadBlog = async (fname: string) => {
  console.log(`[uploadBlog()] Uploading file ${fname}...`);
  const filePath = process.env.BLOG_PATH + "/" + fname;
  const buffer = fs.readFileSync(filePath);

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_CONTENT_BUCKET_NAME!)
    .upload(fname, buffer, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Failed to upload file to supabase", error);
  } else {
    console.log(`[uploadBlog()] Successfully uploaded file ${fname}`);
  }
};

const pushBlogs = async () => {
  console.log("[pushBlogs()]");

  // 1. get list of local .md files
  const localFiles = fs
    .readdirSync(process.env.BLOG_PATH!)
    .filter((f) => f.endsWith(".md"));

  // 2. get list of files on supabase
  const supabaseFiles = await supabase.storage
    .from(process.env.SUPABASE_CONTENT_BUCKET_NAME!)
    .list()
    .then((res) => res.data?.filter((fileObj) => fileObj.name.endsWith(".md")));

  if (supabaseFiles === undefined) {
    throw new Error("Failed to get supabase files");
  }

  // map name -> file obj
  const supabaseFileMap: Record<string, Date> = {};
  for (const file of supabaseFiles) {
    supabaseFileMap[file.name] = new Date(file.updated_at!);
  }

  // 3. for each local file,
  for (const fname of localFiles) {
    const filePath = process.env.BLOG_PATH + "/" + fname;
    const buffer = fs.readFileSync(filePath);

    // if file doesn't exist in `supabaseFileMap`, upload it
    if (!supabaseFileMap[fname]) {
      console.log(`Uploading file to supabase: ${fname}`);

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
        .from(process.env.SUPABASE_CONTENT_BUCKET_NAME!)
        .remove([fname]);

      // 2. reupload
      await uploadBlog(fname);
    }
  }
};

const uploadImage = async (fname: string) => {
  console.log(`[uploadImage()] Uploading image ${fname}...`);
  const filePath = process.env.IMAGE_PATH + "/" + fname;
  const buffer = fs.readFileSync(filePath);
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_IMAGE_BUCKET_NAME!)
    .upload(fname, buffer, {
      contentType: "image/" + fname.split(".").pop(), // <- sets correct content type
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[uploadImage()] Failed to upload image to supabase", error);
  } else {
    console.log("[uploadImage()] Successfully upload image to supabase");
  }
};

const pushImages = async () => {
  console.log("[pushImages()]");

  // 1. get list of local images
  const localFiles = fs.readdirSync(process.env.IMAGE_PATH!);

  // 2. get list of files on supabase
  const supabaseFiles = await supabase.storage
    .from(process.env.SUPABASE_IMAGE_BUCKET_NAME!)
    .list()
    .then((res) => res.data ?? []);

  if (supabaseFiles === undefined) {
    throw new Error("Failed to get supabase files");
  }

  // map name -> file obj
  const supabaseFileMap: Record<string, Date> = {};
  for (const file of supabaseFiles) {
    supabaseFileMap[file.name] = new Date(file.updated_at!);
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
        .from(process.env.SUPABASE_IMAGE_BUCKET_NAME!)
        .remove([fname]);

      // 2. reupload
      await uploadImage(fname);
    }
  }
};

await pushBlogs();
await pushImages();

console.log("Upload complete");
