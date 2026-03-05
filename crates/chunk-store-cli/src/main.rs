//! Chunk Store CLI

use anyhow::Result;
use clap::{Parser, Subcommand};
use chunk_store::ModArchive;
use std::path::PathBuf;
use std::time::Instant;

#[derive(Parser)]
#[command(name = "chunk-store")]
#[command(about = "High-performance mod archive with chunk deduplication")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Add a mod to the archive
    Add {
        /// Path to the mod directory
        mod_path: PathBuf,
        /// Archive directory
        #[arg(short, long, default_value = "./mod-archive")]
        archive: PathBuf,
        /// Mod ID (defaults to directory name)
        #[arg(short, long)]
        id: Option<String>,
        /// Mod name
        #[arg(short, long)]
        name: Option<String>,
    },
    /// Extract a mod from the archive
    Extract {
        /// Mod ID
        mod_id: String,
        /// Output directory
        output: PathBuf,
        /// Archive directory
        #[arg(short, long, default_value = "./mod-archive")]
        archive: PathBuf,
    },
    /// List all mods in the archive
    List {
        /// Archive directory
        #[arg(short, long, default_value = "./mod-archive")]
        archive: PathBuf,
    },
    /// Remove a mod from the archive
    Remove {
        /// Mod ID
        mod_id: String,
        /// Archive directory
        #[arg(short, long, default_value = "./mod-archive")]
        archive: PathBuf,
    },
    /// Run garbage collection
    Gc {
        /// Archive directory
        #[arg(short, long, default_value = "./mod-archive")]
        archive: PathBuf,
    },
    /// Show archive statistics
    Stats {
        /// Archive directory
        #[arg(short, long, default_value = "./mod-archive")]
        archive: PathBuf,
    },
    /// Batch archive all mods in a directory
    Batch {
        /// Directory containing mod folders
        mods_dir: PathBuf,
        /// Archive directory
        #[arg(short, long, default_value = "./mod-archive")]
        archive: PathBuf,
    },
}

fn main() -> Result<()> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Add { mod_path, archive, id, name } => {
            let start = Instant::now();
            let mut arch = ModArchive::open(&archive)?;
            
            println!("Archiving: {}", mod_path.display());
            let manifest = arch.archive_mod(
                &mod_path,
                id.as_deref(),
                name.as_deref(),
            )?;
            
            println!("\n✅ Archive complete");
            println!("   ID: {}", manifest.id);
            println!("   Name: {}", manifest.name);
            println!("   Original size: {:.2} MB", manifest.original_size as f64 / 1024.0 / 1024.0);
            println!("   Files: {} resource files, {} preserved files", 
                manifest.files.len(), manifest.preserved_files.len());
            println!("   Time: {:.2}s", start.elapsed().as_secs_f64());
            
            let stats = arch.get_stats()?;
            println!("\n📊 Archive stats:");
            println!("   Total mods: {}", stats.mod_count);
            println!("   Dedup ratio: {:.1}%", stats.deduplication_ratio() * 100.0);
        }
        
        Commands::Extract { mod_id, output, archive } => {
            let start = Instant::now();
            let arch = ModArchive::open(&archive)?;
            
            println!("Extracting: {} -> {}", mod_id, output.display());
            arch.extract_mod(&mod_id, &output)?;
            
            println!("✅ Extract complete ({:.2}s)", start.elapsed().as_secs_f64());
        }
        
        Commands::List { archive } => {
            let arch = ModArchive::open(&archive)?;
            let mods = arch.list_mods()?;
            
            if mods.is_empty() {
                println!("Archive is empty");
            } else {
                println!("Total {} mods:\n", mods.len());
                for (id, name, _created_at) in mods {
                    println!("  {}", id);
                    println!("    Name: {}", name);
                    println!();
                }
            }
        }
        
        Commands::Remove { mod_id, archive } => {
            let mut arch = ModArchive::open(&archive)?;
            
            if arch.remove_mod(&mod_id)? {
                println!("✅ Removed: {}", mod_id);
            } else {
                println!("❌ Not found: {}", mod_id);
            }
        }
        
        Commands::Gc { archive } => {
            let mut arch = ModArchive::open(&archive)?;
            
            println!("Running garbage collection...");
            let (deleted, freed) = arch.gc()?;
            
            println!("✅ Complete");
            println!("   Deleted chunks: {}", deleted);
            println!("   Freed space: {:.2} MB", freed as f64 / 1024.0 / 1024.0);
        }
        
        Commands::Stats { archive } => {
            let arch = ModArchive::open(&archive)?;
            let stats = arch.get_stats()?;
            
            println!("📊 Archive statistics:\n");
            println!("  Mod count: {}", stats.mod_count);
            println!("  Unique chunks: {}", stats.unique_chunks);
            println!("  Stored size: {:.2} MB", stats.total_stored_size as f64 / 1024.0 / 1024.0);
            println!("  Original size: {:.2} MB", stats.total_original_size as f64 / 1024.0 / 1024.0);
            println!("  Dedup ratio: {:.1}%", stats.deduplication_ratio() * 100.0);
            println!("  Space saved: {:.2} MB", 
                (stats.total_original_size - stats.total_stored_size) as f64 / 1024.0 / 1024.0);
        }
        
        Commands::Batch { mods_dir, archive } => {
            let start = Instant::now();
            let mut arch = ModArchive::open(&archive)?;
            
            let entries: Vec<_> = std::fs::read_dir(&mods_dir)?
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
                .collect();
            
            println!("Found {} mod directories\n", entries.len());
            
            let mut success = 0;
            let mut failed = 0;
            
            for entry in entries {
                let mod_path = entry.path();
                let mod_name = mod_path.file_name().unwrap().to_string_lossy();
                
                print!("Archiving: {}... ", mod_name);
                
                match arch.archive_mod(&mod_path, None, None) {
                    Ok(_) => {
                        println!("✅");
                        success += 1;
                    }
                    Err(e) => {
                        println!("❌ {}", e);
                        failed += 1;
                    }
                }
            }
            
            println!("\nComplete: {} success, {} failed ({:.2}s)", 
                success, failed, start.elapsed().as_secs_f64());
            
            let stats = arch.get_stats()?;
            println!("\n📊 Archive stats:");
            println!("   Dedup ratio: {:.1}%", stats.deduplication_ratio() * 100.0);
            println!("   Stored size: {:.2} MB", stats.total_stored_size as f64 / 1024.0 / 1024.0);
        }
    }
    
    Ok(())
}
