import fs from "fs";
import dotenv from "dotenv";

// load env variables
dotenv.config({ path: "../.env" });

import { getLocalImageFiles, pushImages } from "./utils/images.js";
import {
  getLocalMDFiles,
  getSupabaseContentFiles,
  pruneBlogs,
  pushBlogs,
} from "./utils/blogs.js";

const supabaseContentFiles = await getSupabaseContentFiles();
const localMDFiles = getLocalMDFiles();
await pushBlogs(supabaseContentFiles, localMDFiles);
await pruneBlogs(supabaseContentFiles, localMDFiles);

const localImageFiles = getLocalImageFiles();
await pushImages();

console.log("Upload complete");
