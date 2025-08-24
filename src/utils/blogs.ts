import fs from "fs";
import { supabase } from "./supabase.js";
import type { FileObject } from "@supabase/storage-js";

/**
 * Fetches all MD files from supabase "Content" bucket
 */
export const getSupabaseContentFiles = async () => {
  const supabaseFiles = await supabase.storage
    .from(process.env.SUPABASE_CONTENT_BUCKET_NAME!)
    .list()
    .then((res) => res.data?.filter((fileObj) => fileObj.name.endsWith(".md")));

  if (supabaseFiles === undefined) {
    throw new Error("Failed to get supabase files");
  }

  return supabaseFiles;
};

/**
 * Fetches all .md file names from local fs
 */
export const getLocalMDFiles = () => {
  const localFiles = fs
    .readdirSync(process.env.BLOG_PATH!)
    .filter((f) => f.endsWith(".md"));

  return localFiles;
};

/**
 * Uploads a blog with filename `fname` to supabase
 */
const _uploadBlog = async (fname: string) => {
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

const _removeBlog = async (fname: string) => {
  console.log(`[_removeBlog()] Removing blog ${fname} from Supabase...`);

  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_CONTENT_BUCKET_NAME!)
    .remove([fname]);

  if (error) {
    console.error("[_removeBlog()] Failed to remove blog from supabase", error);
  } else {
    console.log(
      `[_removeBlog()] Successfully removed blog ${fname} from Supabase`
    );
  }
};

/**
 * Pushes all local blogs to supabase
 */
export const pushBlogs = async (
  supabaseFiles: FileObject[],
  localFiles: string[]
) => {
  console.log("[pushBlogs()]");

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

      await _uploadBlog(fname);

      continue;
    }

    // else if file exists in supabase
    // check current file's last updated time
    const stats = fs.statSync(filePath);
    const lastModifiedDate = stats.mtime;
    const supabaseDate = supabaseFileMap[fname];

    if (lastModifiedDate > supabaseDate) {
      await _removeBlog(fname);

      // 2. reupload
      await _uploadBlog(fname);
    }
  }
};

/**
 * Scans supabase blog files, and deletes those that don't exist in `localFiles`.
 */
export const pruneBlogs = async (
  supabaseFiles: FileObject[],
  localFiles: string[]
) => {
  console.log("[pruneBlogs()] Pruning blogs from Supabase...");

  const localFileSet = new Set<string>(localFiles);

  for (const supabaseFile of supabaseFiles) {
    if (!localFileSet.has(supabaseFile.name)) {
      await _removeBlog(supabaseFile.name);
    }
  }
};
