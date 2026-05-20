# Industries Migration Script

This script migrates industry data from markdown files to Sanity CMS.

## Prerequisites

1. **Install required packages** (if not already installed):
   ```bash
   cd apps/studio
   npm install gray-matter
   ```

2. **Set environment variables**:
   Create or update `.env.local` in `apps/studio` with:
   ```
   SANITY_PROJECT_ID=your_project_id
   SANITY_DATASET=production
   SANITY_AUTH_TOKEN=your_auth_token
   ```

   To get your auth token:
   - Go to https://manage.sanity.io/
   - Select your project
   - Go to Settings → API → Tokens
   - Create a new token with "Editor" permissions
   - Copy the token value

## Running the Migration

### From the studio directory:
```bash
cd apps/studio
node scripts/migrate-industries.js
```

### Or from the root directory:
```bash
node apps/studio/scripts/migrate-industries.js
```

## What the Script Does

1. **Reads** all `.md` files from `apps/web/src/content/industries/`
2. **Parses** frontmatter (YAML) and content
3. **Uploads images** from URLs to Sanity assets
4. **Creates/Updates** industry documents in Sanity with:
   - Core metadata (title, slug, summary, description)
   - SEO settings
   - Social media (OG, Twitter)
   - Hero section
   - Three tier problems
   - Benefits & delivery
   - Value proposition
   - ROI section
   - Blog section with category
   - FAQs section with slug

## Expected Output

```
Starting industries migration to Sanity...

Found 4 industry files to migrate

Migrating: industry_legal_content.md
✓ Created/updated: AI Solutions for Law Firms & Legal Enterprises (ID: abc123...)
Migrating: industry_healthcare_content.md
✓ Created/updated: AI Solutions for Healthcare Organizations... (ID: def456...)
...

==================================================
MIGRATION COMPLETE
==================================================
✓ Successful: 4
✗ Failed: 0
```

## Troubleshooting

### "SANITY_PROJECT_ID is not defined"
- Check that `.env.local` exists in `apps/studio`
- Verify the environment variables are set correctly
- Restart the script

### "Invalid auth token"
- Generate a new token from https://manage.sanity.io/
- Make sure the token has "Editor" permissions

### "Image upload failed"
- The script logs warnings but continues
- You can manually upload images in Sanity studio later
- Check that URLs in markdown are valid and accessible

### "ENOENT: no such file or directory"
- Make sure you're running from the correct directory
- Verify the industries folder exists at `apps/web/src/content/industries/`

## After Migration

1. ✓ Check Sanity studio to verify documents were created
2. ✓ Review any images that failed to upload and upload manually
3. ✓ Update your `data.ts` to use Sanity queries (already done if `USE_SANITY=true`)
4. ✓ Optional: Keep markdown files as backup or delete them

## Rollback

If you need to undo the migration:
1. Go to https://manage.sanity.io/
2. Select your project
3. Go to Datasets
4. Create a backup of your current dataset
5. Manually delete the migrated industry documents in the studio

Or restore from a backup if available.

## Questions?

For more info on Sanity authentication and API:
- https://www.sanity.io/docs/authentication
- https://www.sanity.io/docs/http-api
