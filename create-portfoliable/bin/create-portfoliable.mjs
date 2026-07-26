#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const DEFAULT_TARGET = 'my-portfolio';

function color(code, message) {
  return `\x1b[${code}m${message}\x1b[0m`;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    target: DEFAULT_TARGET,
    force: false,
    install: true,
    preview: true
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--force') {
      options.force = true;
      continue;
    }

    if (arg === '--no-install') {
      options.install = false;
      continue;
    }

    if (arg === '--no-preview') {
      options.preview = false;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (!arg.startsWith('-') && options.target === DEFAULT_TARGET) {
      options.target = arg;
    }
  }

  return options;
}

function printHelp() {
  console.log('Usage: npm create portfoliable@latest [project-name] [-- --force] [-- --no-install] [-- --no-preview]');
  console.log('');
  console.log('Options:');
  console.log('  --force       Create in a non-empty directory');
  console.log('  --no-install  Skip npm install');
  console.log('  --no-preview  Skip auto-starting the preview server');
}

function printCommandsBox() {
  const width = 72;
  const line = (text = '') => `│ ${text.padEnd(width - 4)} │`;

  console.log('╭' + '─'.repeat(width - 2) + '╮');
  console.log(line('Available commands'));
  console.log(line());
  console.log(line('npm run portfoliable'));
  console.log(line('npm run portfoliable-build | npm run build-portfoliable'));
  console.log(line('npm run portfoliable-preview | npm run preview-portfoliable'));
  console.log(line('npm run portfoliable-scaffold-data | npm run scaffold-data-portfoliable'));
  console.log(line('npm run portfoliable-scaffold-case | npm run scaffold-case-portfoliable'));
  console.log(line('npx @portfoliablejs/portfoliable scaffold-case --name "My New Case"'));
  console.log('╰' + '─'.repeat(width - 2) + '╯');
}

function sanitizePackageName(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-portfolio';
}

function isDirectoryEmpty(dirPath) {
  if (!fs.existsSync(dirPath)) return true;
  const files = fs.readdirSync(dirPath).filter((entry) => entry !== '.DS_Store');
  return files.length === 0;
}

function writeFileFromTemplate(templateRoot, relativePath, targetRoot, transforms = []) {
  const sourcePath = path.join(templateRoot, relativePath);
  const destinationPath = path.join(targetRoot, relativePath);
  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });

  let content = fs.readFileSync(sourcePath, 'utf8');
  for (const transform of transforms) {
    content = transform(content);
  }

  fs.writeFileSync(destinationPath, content, 'utf8');
}

function writeGitignoreTemplate(templateRoot, targetRoot) {
  const candidates = ['.gitignore', 'gitignore'];

  for (const candidate of candidates) {
    const sourcePath = path.join(templateRoot, candidate);
    if (!fs.existsSync(sourcePath)) continue;

    const destinationPath = path.join(targetRoot, '.gitignore');
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.writeFileSync(destinationPath, fs.readFileSync(sourcePath, 'utf8'), 'utf8');
    return;
  }

  throw new Error('Missing gitignore template file in create-portfoliable package.');
}

function copyTemplateTree(templateRoot, relativePath, targetRoot) {
  const sourcePath = path.join(templateRoot, relativePath);
  const destinationPath = path.join(targetRoot, relativePath);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing template file: ${sourcePath}`);
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.writeFileSync(destinationPath, fs.readFileSync(sourcePath, 'utf8'), 'utf8');
}

function copyTemplateDirectory(templateRoot, relativeDirPath, targetRoot) {
  const sourceDir = path.join(templateRoot, relativeDirPath);
  const destinationDir = path.join(targetRoot, relativeDirPath);

  if (!fs.existsSync(sourceDir) || !fs.statSync(sourceDir).isDirectory()) {
    throw new Error(`Missing template directory: ${sourceDir}`);
  }

  fs.mkdirSync(destinationDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      copyTemplateDirectory(templateRoot, path.join(relativeDirPath, entry.name), targetRoot);
      continue;
    }

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function run() {
  const options = parseArgs(process.argv);

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  const cwd = process.cwd();
  const projectName = path.basename(options.target);
  const packageName = sanitizePackageName(projectName);
  const targetDir = path.resolve(cwd, options.target);

  if (!options.force && !isDirectoryEmpty(targetDir)) {
    console.error(color('31', `Refusing to create in non-empty directory: ${targetDir}`));
    console.error(color('33', 'Use --force if you want to continue.'));
    process.exit(1);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const currentFile = fileURLToPath(import.meta.url);
  const templateRoot = path.resolve(path.dirname(currentFile), '..', 'templates');

  const packageJsonTemplate = JSON.stringify(
    {
      name: packageName,
      version: '1.0.0',
      private: true,
      type: 'module',
      scripts: {
        portfoliable: 'portfoliable dev',
        'portfoliable-build': 'portfoliable build',
        'portfoliable-preview': 'portfoliable preview',
        'portfoliable-scaffold-data': 'portfoliable scaffold --out ./src/portfolio-cases.template.js',
        'portfoliable-scaffold-case': 'node ./scripts/scaffold-case.mjs',
        'build-portfoliable': 'npm run portfoliable-build',
        'preview-portfoliable': 'npm run portfoliable-preview',
        'scaffold-data-portfoliable': 'npm run portfoliable-scaffold-data',
        'scaffold-case-portfoliable': 'npm run portfoliable-scaffold-case'
      },
      dependencies: {
        '@portfoliablejs/valence': '^0.1.0',
        '@portfoliablejs/portfoliable': '^2.3.0'
      }
    },
    null,
    2
  );

  fs.writeFileSync(path.join(targetDir, 'package.json'), `${packageJsonTemplate}\n`, 'utf8');

  writeGitignoreTemplate(templateRoot, targetDir);
  writeFileFromTemplate(templateRoot, 'index.html', targetDir);
  writeFileFromTemplate(templateRoot, path.join('src', 'main.js'), targetDir);
  writeFileFromTemplate(templateRoot, path.join('src', 'data.js'), targetDir);
  writeFileFromTemplate(templateRoot, path.join('src', 'cases', 'index.js'), targetDir);
  writeFileFromTemplate(templateRoot, path.join('src', 'parser', 'markdown.js'), targetDir);
  copyTemplateDirectory(templateRoot, path.join('src', 'assets'), targetDir);
  copyTemplateTree(templateRoot, path.join('scripts', 'scaffold-case.mjs'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'README.md'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'mobile-product-launch.md'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'mobile-checkout-flow.md'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'compact-research-archive.md'), targetDir);
  copyTemplateTree(templateRoot, path.join('src', 'content', 'cases', 'wearable-companion.md'), targetDir);

  const readme = `# ${projectName}\n\nCreated with create-portfoliable.\n\n## Where to edit cases\n\n- Add or update markdown cases in \`src/content/cases/\`\n- Each \`.md\` file becomes a gallery item after preview/build reloads\n- Starter thumbnails use local frame assets copied to \`src/assets/devices/\`\n\n## Commands\n\n- npm run portfoliable\n- npm run portfoliable-build (or npm run build-portfoliable)\n- npm run portfoliable-preview (or npm run preview-portfoliable)\n- npm run portfoliable-scaffold-data (or npm run scaffold-data-portfoliable)\n- npm run portfoliable-scaffold-case (or npm run scaffold-case-portfoliable)\n`;
  fs.writeFileSync(path.join(targetDir, 'README.md'), readme, 'utf8');

  console.log(color('36', `Created ${projectName} at ${targetDir}`));

  if (!options.install) {
    console.log(color('33', 'Skipped npm install (--no-install).'));
    console.log(`Next steps:\n  cd ${options.target}\n  npm install\n  npm run portfoliable`);
    return;
  }

  console.log(color('36', 'Installing dependencies...'));
  const installResult = spawnSync('npm', ['install'], {
    cwd: targetDir,
    stdio: 'inherit'
  });

  if (installResult.status !== 0) {
    console.error(color('31', 'npm install failed. Run it manually in the new project folder.'));
    process.exit(installResult.status || 1);
  }

  console.log(color('32', 'Setup complete.'));

  printCommandsBox();

  if (options.preview) {
    console.log(color('36', 'Launching preview server...'));
    const previewResult = spawnSync('npm', ['run', 'portfoliable-preview'], {
      cwd: targetDir,
      stdio: 'inherit'
    });

    if (previewResult.status !== 0) {
      process.exit(previewResult.status || 1);
    }
    return;
  }

  console.log(`Next steps:\n  cd ${options.target}\n  npm run portfoliable`);
}

run();
