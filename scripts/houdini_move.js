const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const docsPath = path.join(root, 'docs');
const archivePath = path.join(docsPath, 'archive');

const filesToArchive = fs.readdirSync(docsPath).filter(file => {
    return file.startsWith('executor_prompt_phase_') ||
        file.startsWith('implementation_plan_phase_') ||
        file.startsWith('UAT_PHASE_') ||
        file.startsWith('SESSION_REPORT_') ||
        file.startsWith('implementation_plan_restructuring') ||
        file.startsWith('walkthrough_phase_');
});

console.log(`Found ${filesToArchive.length} files to archive.`);

filesToArchive.forEach(file => {
    const oldPath = path.join(docsPath, file);
    const newPath = path.join(archivePath, file);
    try {
        fs.renameSync(oldPath, newPath);
        console.log(`✅ Archived: ${file}`);
    } catch (err) {
        console.error(`❌ Failed to archive ${file}:`, err.message);
    }
});

// Clean up root files if they still exist (migration check)
const rootFilesToMove = [
    { from: 'backend/Dockerfile', to: 'infrastructure/Dockerfile' },
    { from: 'backend/docker-compose.yml', to: 'infrastructure/docker-compose.yml' },
    { from: 'frontend/vercel.json', to: 'infrastructure/vercel.json' },
    { from: 'backend/check-order.js', to: 'scripts/check-order.js' },
    { from: 'backend/test-order.js', to: 'scripts/test-order.js' }
];

rootFilesToMove.forEach(m => {
    const oldPath = path.join(root, m.from);
    const newPath = path.join(root, m.to);
    if (fs.existsSync(oldPath)) {
        try {
            // If the destination already exists (because I wrote it with write_to_file), 
            // the rename might fail if it's not the same. We'll just delete the old one.
            if (fs.existsSync(newPath)) {
                fs.unlinkSync(oldPath);
                console.log(`🗑️ Deleted old (already migrated): ${m.from}`);
            } else {
                fs.renameSync(oldPath, newPath);
                console.log(`✅ Moved: ${m.from} -> ${m.to}`);
            }
        } catch (err) {
            console.error(`❌ Failed to move ${m.from}:`, err.message);
        }
    }
});

console.log('Migration complete.');
