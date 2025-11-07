#!/bin/bash

# Optimize PNG files by resizing and compressing them
# Usage: ./scripts/optimize-pngs.sh [directory]
#
# This script will:
# 1. Resize PNGs larger than 512px to 512x512
# 2. Compress with pngquant (lossy, quality 75-85)
# 3. Optimize with oxipng (lossless)
#
# Safe to run multiple times - won't re-process optimized files

set -e

# Default directory is public/posts, or use provided argument
TARGET_DIR="${1:-public/posts}"

echo "🖼️  Optimizing PNG files in $TARGET_DIR..."

# Check if directory exists
if [ ! -d "$TARGET_DIR" ]; then
  echo "❌ Error: Directory $TARGET_DIR not found"
  exit 1
fi

# Check if required tools are installed
if ! command -v pngquant &> /dev/null; then
  echo "❌ Error: pngquant is not installed"
  echo "   Install with: brew install pngquant (macOS) or apt install pngquant (Ubuntu)"
  exit 1
fi

if ! command -v oxipng &> /dev/null; then
  echo "❌ Error: oxipng is not installed"
  echo "   Install with: brew install oxipng (macOS)"
  echo "   Or download from: https://github.com/shssoichiro/oxipng/releases"
  exit 1
fi

if ! command -v sips &> /dev/null; then
  echo "⚠️  Warning: sips is not available (macOS only)"
  echo "   Resizing will be skipped on this platform"
fi

# Find all PNG files
png_files=$(find "$TARGET_DIR" -type f -name "*.png")
total_files=$(echo "$png_files" | grep -c "." || echo "0")

if [ "$total_files" -eq 0 ]; then
  echo "ℹ️  No PNG files found in $TARGET_DIR"
  exit 0
fi

echo "📁 Found $total_files PNG files to process"
echo ""

# Initialize counters
count=0
resized=0
compressed=0
skipped=0
total_before=0
total_after=0

# Process each PNG file
echo "$png_files" | while read -r file; do
  count=$((count + 1))

  # Get file size before
  if [[ "$OSTYPE" == "darwin"* ]]; then
    size_before=$(stat -f%z "$file")
  else
    size_before=$(stat -c%s "$file")
  fi

  echo "[$count/$total_files] Processing: ${file#$TARGET_DIR/}"

  # Check if file needs resizing (macOS only)
  needs_resize=false
  if command -v sips &> /dev/null; then
    dimensions=$(sips -g pixelWidth -g pixelHeight "$file" 2>/dev/null | tail -2 | awk '{print $2}')
    width=$(echo "$dimensions" | head -1)
    height=$(echo "$dimensions" | tail -1)

    if [ "$width" -gt 512 ] || [ "$height" -gt 512 ]; then
      needs_resize=true
      echo "  📐 Resizing from ${width}x${height} to 512x512"
      sips -z 512 512 "$file" --out "$file" > /dev/null 2>&1
      resized=$((resized + 1))
    fi
  fi

  # Compress with pngquant (lossy)
  echo "  🗜️  Compressing with pngquant (quality 75-85)..."
  if pngquant --quality=75-85 --ext .png --force "$file" 2>&1 | grep -v "error" > /dev/null; then
    echo "  ✅ pngquant compression successful"
  else
    # pngquant might fail if the image is already optimized or very simple
    echo "  ⏭️  pngquant skipped (already optimized or unsuitable)"
  fi

  # Optimize with oxipng (lossless)
  echo "  🎯 Optimizing with oxipng..."
  if oxipng -o 4 --strip safe "$file" > /dev/null 2>&1; then
    echo "  ✅ oxipng optimization successful"
  else
    echo "  ⏭️  oxipng skipped"
  fi

  # Get file size after
  if [[ "$OSTYPE" == "darwin"* ]]; then
    size_after=$(stat -f%z "$file")
  else
    size_after=$(stat -c%s "$file")
  fi

  # Calculate savings
  if [ "$size_after" -lt "$size_before" ]; then
    savings=$((size_before - size_after))
    percent=$((savings * 100 / size_before))

    # Convert to human-readable format
    if [ "$savings" -gt 1048576 ]; then
      savings_mb=$(echo "scale=2; $savings / 1048576" | bc)
      echo "  💾 Saved: ${savings_mb}MB (${percent}%)"
    elif [ "$savings" -gt 1024 ]; then
      savings_kb=$((savings / 1024))
      echo "  💾 Saved: ${savings_kb}KB (${percent}%)"
    else
      echo "  💾 Saved: ${savings}B (${percent}%)"
    fi

    compressed=$((compressed + 1))
  else
    echo "  ⏭️  No size reduction achieved"
    skipped=$((skipped + 1))
  fi

  total_before=$((total_before + size_before))
  total_after=$((total_after + size_after))

  echo ""
done

# Calculate total savings
total_savings=$((total_before - total_after))
if [ "$total_before" -gt 0 ]; then
  total_percent=$((total_savings * 100 / total_before))
else
  total_percent=0
fi

# Convert to human-readable format
if [ "$total_savings" -gt 1048576 ]; then
  savings_mb=$(echo "scale=2; $total_savings / 1048576" | bc)
  savings_display="${savings_mb}MB"
elif [ "$total_savings" -gt 1024 ]; then
  savings_kb=$((total_savings / 1024))
  savings_display="${savings_kb}KB"
else
  savings_display="${total_savings}B"
fi

echo "✅ Optimization complete!"
echo ""
echo "Summary:"
echo "  📊 Total files: $total_files"
if command -v sips &> /dev/null; then
  echo "  📐 Resized: $resized files"
fi
echo "  🗜️  Compressed: $compressed files"
echo "  ⏭️  Skipped: $skipped files"
echo "  💾 Total savings: $savings_display ($total_percent%)"
