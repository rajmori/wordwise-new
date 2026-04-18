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

const targetDir = 'd:\\wordwise-new';
walkDir(targetDir, function(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    const searchString = '<a href="subscription.html">Courses</a>';
    const searchStringSub = '<a href="../subscription.html">Courses</a>';
    let changed = false;

    if (content.includes(searchString)) {
        const regex = /([ \t]*)<a href="subscription\.html">Courses<\/a>/g;
        content = content.replace(regex, '$1<a href="subscription.html">Pricing</a>\n$1<a href="contact.html">Contact</a>');
        changed = true;
    }
    if (content.includes(searchStringSub)) {
        const regex2 = /([ \t]*)<a href="\.\.\/subscription\.html">Courses<\/a>/g;
        content = content.replace(regex2, '$1<a href="../subscription.html">Pricing</a>\n$1<a href="../contact.html">Contact</a>');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated HTML:', filePath);
    }
});

const navFile = path.join(targetDir, 'js', 'navigation.js');
if (fs.existsSync(navFile)) {
    let navContent = fs.readFileSync(navFile, 'utf8');
    navContent = navContent.replace(/coursesPricingLink\.textContent = 'Courses';/g, "coursesPricingLink.textContent = 'Pricing';");
    fs.writeFileSync(navFile, navContent, 'utf8');
    console.log('Updated js/navigation.js');
}
