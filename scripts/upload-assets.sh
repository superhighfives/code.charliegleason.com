#!/bin/bash

# Upload visual assets (videos and images) to R2 bucket
# Usage: ./scripts/upload-assets.sh
#
# Supports both production and staging environments.
# Production uses: visual-assets
# Staging uses: visual-assets-staging
#
# Only uploads files that have changed (based on MD5 hash comparison with local cache)

set -e

# Detect environment (staging or production)
ENV="${CLOUDFLARE_ENV:-production}"

# Set bucket name based on environment
if [ "$ENV" = "staging" ]; then
  BUCKET="visual-assets-staging"
else
  BUCKET="visual-assets"
fi

echo "🎬 Uploading visual assets to R2 ($ENV → $BUCKET)..."

# Check if public/posts directory exists
if [ ! -d "public/posts" ]; then
  echo "❌ Error: public/posts directory not found"
  exit 1
fi

# Cache file path
CACHE_FILE=".upload-cache.json"

# Initialize cache if it doesn't exist
if [ ! -f "$CACHE_FILE" ]; then
  echo '{}' > "$CACHE_FILE"
fi

# Count total files to process
total_files=$(find public/posts -type f \( -name "*.mp4" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.webp" \) | wc -l | tr -d ' ')
echo "📁 Found $total_files visual assets to process"

# Temporary file to track stats (use a temp file to work around subshell issues)
stats_file=$(mktemp)
echo "0 0" > "$stats_file"

# Temporary file to track updated cache entries
cache_updates=$(mktemp)
echo "{}" > "$cache_updates"

# Function to optimize PNG files before upload
optimize_png() {
  local file="$1"

  # Check if optimization tools are available
  if ! command -v pngquant &> /dev/null || ! command -v oxipng &> /dev/null; then
    # Tools not available, skip optimization
    return 0
  fi

  # Check if file needs resizing (macOS only)
  if command -v sips &> /dev/null; then
    dimensions=$(sips -g pixelWidth -g pixelHeight "$file" 2>/dev/null | tail -2 | awk '{print $2}')
    width=$(echo "$dimensions" | head -1)
    height=$(echo "$dimensions" | tail -1)

    if [ "$width" -gt 512 ] || [ "$height" -gt 512 ]; then
      sips -z 512 512 "$file" --out "$file" > /dev/null 2>&1
    fi
  fi

  # Compress with pngquant (suppress output)
  pngquant --quality=75-85 --ext .png --force "$file" 2>&1 | grep -v "error" > /dev/null || true

  # Optimize with oxipng (suppress output)
  oxipng -o 4 --strip safe "$file" > /dev/null 2>&1 || true
}

# Find and upload changed visual assets
count=0
find public/posts -type f \( -name "*.mp4" -o -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.webp" \) | while read -r file; do
  # Get the relative path from public/
  relative_path="${file#public/}"
  count=$((count + 1))

  # Optimize PNG files before upload (if tools are available)
  if [[ "$file" == *.png ]]; then
    optimize_png "$file"
  fi

  # Calculate local file MD5
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    local_md5=$(md5 -q "$file")
  else
    # Linux
    local_md5=$(md5sum "$file" | awk '{print $1}')
  fi

  # Get cached MD5 from cache file
  cached_md5=$(node -e "
    const fs = require('fs');
    const cache = JSON.parse(fs.readFileSync('$CACHE_FILE', 'utf8'));
    const env = '$ENV';
    const path = '$relative_path';
    console.log((cache[env] && cache[env][path]) || '');
  " 2>/dev/null || echo "")

  # Read current stats
  read uploaded skipped < "$stats_file"

  # Compare hashes
  if [ "$local_md5" = "$cached_md5" ] && [ -n "$cached_md5" ]; then
    echo "  ⏭️  [$count/$total_files] Skipping $relative_path (unchanged)"
    skipped=$((skipped + 1))
  else
    echo "  📤 [$count/$total_files] Uploading $relative_path..."
    npx wrangler r2 object put "$BUCKET/$relative_path" --remote --file "$file" 2>&1 | grep -v "wrangler" || true
    uploaded=$((uploaded + 1))

    # Update cache with new MD5
    node -e "
      const fs = require('fs');
      const cache = JSON.parse(fs.readFileSync('$CACHE_FILE', 'utf8'));
      const env = '$ENV';
      const path = '$relative_path';
      const md5 = '$local_md5';
      if (!cache[env]) cache[env] = {};
      cache[env][path] = md5;
      fs.writeFileSync('$CACHE_FILE', JSON.stringify(cache, null, 2));
    " 2>/dev/null || true
  fi

  # Update stats
  echo "$uploaded $skipped" > "$stats_file"
done

# Read final stats
read uploaded skipped < "$stats_file"
rm "$stats_file"
rm "$cache_updates"

echo ""
echo "✅ Upload complete!"
echo "   📤 Uploaded: $uploaded files"
echo "   ⏭️  Skipped: $skipped files (unchanged)"
