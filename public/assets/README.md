# Environment Background Assets

This directory contains WebP image assets for different environment backgrounds.

## Required Files

The following WebP images should be placed in this directory:

- `training_ground.webp` - Outdoor training field background
- `cave.webp` - Dark underground cavern background
- `dungeon_corridor.webp` - Stone dungeon corridor background
- `forest.webp` - Dense woodland background
- `ruins.webp` - Ancient crumbling structures background
- `crypt.webp` - Gothic undead tomb background

## Image Specifications

- **Format**: WebP
- **Resolution**: 1920x1080 (or higher for retina displays)
- **Aspect Ratio**: 16:9
- **File Size**: Optimized for web (typically 100-500KB per image)

## Naming Convention

The filename should match the environment type exactly:

- Environment type: `training_ground` → File: `training_ground.webp`
- Environment type: `dungeon_corridor` → File: `dungeon_corridor.webp`

## Fallback

If an image is missing, the system will fall back to a gradient background and still show particle effects and ambient lighting.

## Generating Placeholder Images

Run the placeholder generator script to create temporary images for testing:

```bash
node scripts/generate-placeholder-assets.js
```

This will create `placeholder-assets.html` which can be used to generate placeholder images.
