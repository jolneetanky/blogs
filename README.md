`src/index.ts` contains a script to update Supabase with the blogs in your local filesystem.

When run, this script does a few things:

1. Pushes all newly created blogs in `process.env.BLOG_PATH` to supabase (by checking if the name exists in the supabase bucket)
2. Check if an entry has been modified (by comparing last updated timestamps)
3. If modified -> delete and upload file
4. Same for images in `process.env.IMAGE_PATH`.

You can also use this script for your own blogs (given they're `.md` files). All that's needed is:

1. Create separate Supabase storage buckets for your blogs and images.
2. Get the Supabase API key for your project.
3. Have a local directory to store your blogs. You can edit it however you like, personally I use Obsidian.

# To run:

`npm run build`
`npm start`
