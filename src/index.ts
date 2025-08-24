import dotenv from "dotenv";

// load env variables
dotenv.config({ path: "../.env" });

import {
  getLocalImageFiles,
  getSupabaseImageFiles,
  pruneImages,
  pushImages,
} from "./utils/images.js";
import {
  getLocalMDFiles,
  getSupabaseContentFiles,
  pruneBlogs,
  pushBlogs,
} from "./utils/blogs.js";

// Sync blog files
const supabaseContentFiles = await getSupabaseContentFiles();
const localMDFiles = getLocalMDFiles();
await pushBlogs(supabaseContentFiles, localMDFiles);
await pruneBlogs(supabaseContentFiles, localMDFiles);

// Sync image files
const supabaseImageFiles = await getSupabaseImageFiles();
const localImageFiles = getLocalImageFiles();
await pushImages(localImageFiles, supabaseImageFiles);
await pruneImages(localImageFiles, supabaseImageFiles);

console.log("Upload complete");
