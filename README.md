This is a simple script to update Supabase with the blogs in your local filesystem.

When run, this script does a few things:

1. Pushes all newly created blogs in `process.env.BLOG_PATH` to Supabase (by checking if the name exists in the Supabase bucket)
2. Check if an entry has been modified (by comparing last updated timestamps)
3. If modified -> delete and upload file
4. Prunes files that are not in your local blog file directory from Supabase.
5. Same for images in `process.env.IMAGE_PATH`.

You can also use this script for your own blogs (given they're `.md` files). All that's needed is:

1. Create separate Supabase storage buckets for your blogs and images.
2. Get the Supabase API Service Role key for your project.
3. Have a local directory to store your blogs. You can edit it however you like, personally I use Obsidian.
4. Edit your blogs as you like.
5. Run the script (`npm run dev`) to sync the blogs and images in your local filesystem with your Supabase buckets.

# To build:

```sh
npm run build
```

# To start:

```sh
npm start

```
