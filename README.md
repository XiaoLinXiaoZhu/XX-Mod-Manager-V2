## What is this

This is the V2.0 version of [XX-Mod-Manager](https://github.com/XiaoLinXiaoZhu/XX-Mod-Manager).

## Why 2.0

The original XX-Mod-Manager was developed using nodejs + js + electron, which led to several difficult-to-solve problems:
- Large size, installation package around 250MB, not to mention that electron also leaves a mess in the C drive, placing a bunch of cache files in AppData (approximately 500MB if not cleaned promptly)
- Very slow startup speed for the single-file version, taking 5-10 seconds to start, while the loose version also starts slowly, taking 2-3 seconds
- Difficult to maintain, as JS code becomes hard to maintain when it grows large, especially for complex logic. JS's weak type system causes many bugs to be discovered only at runtime
- Difficult to implement automatic updates, as electron has no officially implemented update mechanism, and the large file size makes updates troublesome

The new version switched to bun + ts + tauri(rust), solving the above issues:
- Small size, installation package around 20MB, with no cache files
- Fast startup speed, single-file version starts in 0.5 seconds
- Single-file, the default package is a single-file version, small in size with fast startup
- Automatic updates using tauri's update mechanism, supporting incremental updates with small size and fast speed
- Easy maintenance, developed with ts + rust, powerful type system, and rust's compiler is very intelligent, automatically inferring many types, reducing bugs

The previous xxmm considered too few things. Despite implementing a flexible plugin system, compromises had to be made in the implementation as features increased, resulting in increasingly complex code that became harder to maintain.

The new version can learn from previous experience and combine community feedback to redesign and organize code, as well as design better page layouts, making it easier to use and maintain.

## Milestone Goals

- [ ] Automatic updates, supporting incremental updates
- [ ] Old code migration, preserving the core, optimizing processing logic
- [ ] Plugin system, supporting plugin installation and uninstallation
- [ ] Optimized UI