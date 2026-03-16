# Build Assets Directory

This directory contains the assets needed for building the Electron desktop application.

## Required Files

### Windows (Required for Windows builds)

- `icon.ico` - Main application icon (256x256px recommended)
- `installer.ico` - Installer icon (256x256px recommended)
- `uninstaller.ico` - Uninstaller icon (256x256px recommended)
- `installer-header.bmp` - Installer header image (493x58px)
- `installer-sidebar.bmp` - Installer sidebar image (164x314px)

### macOS (Required for macOS builds)

- `icon.icns` - Application icon (1024x1024px recommended)
- `background.png` - DMG background image (540x380px)

### Linux (Required for Linux builds)

- `icon.png` - Application icon (512x512px recommended)

## Creating Icons

### Windows Icons (.ico)

You can create .ico files using:

- [GIMP](https://www.gimp.org/) - Free and open source
- [IcoFX](https://icofx.ro/) - Specialized icon editor
- [Online converters](https://convertio.co/ico-png/)

### macOS Icons (.icns)

You can create .icns files using:

- [Iconutil](https://developer.apple.com/library/archive/documentation/CoreGraphics/Conceptual/OnScreenResolution/OnScreenResolution.html) - Built-in macOS tool
- [Icon Composer](https://www.macupdate.com/app/mac/29161/icon-composer) - Third-party tool
- [Online converters](https://cloudconvert.com/png-to-icns)

### Linux Icons (.png)

Use any image editor to create PNG files:

- [GIMP](https://www.gimp.org/)
- [Photoshop](https://www.adobe.com/products/photoshop.html)
- [Paint.NET](https://www.getpaint.net/)

## Placeholder Icons

For development and testing, you can use placeholder icons. Create simple colored squares or use online icon generators.

## Icon Guidelines

1. **Size**: Use the recommended sizes for best quality
2. **Format**: Use the correct format for each platform
3. **Transparency**: Use transparency for better integration
4. **Color**: Use colors that work well on different backgrounds
5. **Simplicity**: Keep the design simple and recognizable

## Automation

You can automate icon generation using tools like:

- [electron-icon-builder](https://www.npmjs.com/package/electron-icon-builder)
- [png-to-icns](https://www.npmjs.com/package/png-to-icns)
- [ico-to-png](https://www.npmjs.com/package/ico-to-png)

Example:

```bash
npm install --save-dev electron-icon-builder
npx electron-icon-builder --input=./build/icon.png --output=./build
```

## Notes

- All icon files should be placed in this directory
- The build process will automatically use these files
- Missing icons will cause the build to fail
- Icon files are not included in the final application bundle
