import fs from "fs";
import { supabase } from "./supabase.js";

export const getLocalImageFiles = () => {
  const localFiles = fs.readdirSync(process.env.IMAGE_PATH!);
  return localFiles;
};

/**
 * Uploads an image file to Supabase "images" bucket
 */
const _uploadImage = async (fname: string) => {
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

const _removeImage = async (fname: string) => {
  console.log(`[_removeImage()] Removing image ${fname}... from Supabase...`);

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_IMAGE_BUCKET_NAME!)
    .remove([fname]);

  if (error) {
    console.error(
      "[_removeImage()] Failed to remove image from Supabase",
      error
    );
  } else {
    console.log("[_removeImage()] Successfully upload image from Supabase");
  }
};

/**
 * Pushes images in local fs to Supabase
 */
export const pushImages = async () => {
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
      await _uploadImage(fname);
      continue;
    }

    // else if file exists in supabase
    // check current file's last updated time
    const stats = fs.statSync(filePath);
    const lastModifiedDate = stats.mtime;
    const supabaseDate = supabaseFileMap[fname];

    // if file has been updated,
    // 1. delete it from supabase
    // 2. reupload to supabase
    if (lastModifiedDate > supabaseDate) {
      await _removeImage(fname);
      await _uploadImage(fname);
    }
  }
};
