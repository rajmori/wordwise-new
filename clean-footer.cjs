const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            if (['node_modules', 'dist', 'server', '.git'].includes(f)) return;
            walkDir(dirPath, callback);
        } else if (f.endsWith('.html')) {
            callback(path.join(dir, f));
        }
    });
}

walkDir('d:\\wordwise-new', function(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We want to remove the contact link if it appears immediately before the For Schools link
    const regex1 = /([ \t]*)<a href="contact\.html">Contact<\/a>(\r?\n[ \t]*<a href="#">For Schools<\/a>)/g;
    const regex2 = /([ \t]*)<a href="\.\.\/contact\.html">Contact<\/a>(\r?\n[ \t]*<a href="#">For Schools<\/a>)/g;
    
    let changed = false;
    
    if (regex1.test(content)) {
        content = content.replace(regex1, '$2');
        changed = true;
    }
    if (regex2.test(content)) {
        content = content.replace(regex2, '$2');
        changed = true;
    }
    
    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed footer in:', filePath);
    }
});
