/*
 * Copyright (C) 2026 P. G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Define GPLv3 Boilerplate
const HEADER = `/*
 * Copyright (C) ${new Date().getFullYear()} P. G. Richardson
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */`

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../')
const targetFolders = ['app/src', 'backend/src']

const ignoreDirs = ['node_modules', 'dist', 'build', '.git', 'coverage']
const isFixMode = process.argv.includes('--fix')

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList

  const files = fs.readdirSync(dir)
  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      if (!ignoreDirs.includes(file)) {
        getFiles(fullPath, fileList)
      }
    } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
      fileList.push(fullPath)
    }
  }
  return fileList
}

console.log('Scanning for missing license headers...\n')

let missingCount = 0
let allFiles = []

// Gather files from all target folders
for (const folder of targetFolders) {
  const fullFolderPath = path.join(rootDir, folder)
  allFiles = getFiles(fullFolderPath, allFiles)
}

// Check and fix files
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8')

  // Check if the file starts with the word 'Copyright' within the first 100 chars
  // Prevents it from duplicating headers if the year is slightly different
  const hasHeader = content.substring(0, 100).includes('Copyright (C)')

  if (!hasHeader) {
    const relativePath = path.relative(rootDir, file)
    if (isFixMode) {
      fs.writeFileSync(file, `${HEADER}\n\n${content}`, 'utf8')
      console.log(`[FIXED] Added header to: ${relativePath}`)
    } else {
      console.error(`[FLAG] Missing header: ${relativePath}`)
      missingCount++
    }
  }
}

if (!isFixMode) {
  if (missingCount > 0) {
    console.error(`\n❌ Found ${missingCount} files missing the GPL license header.`)
    console.error(`Run 'pnpm run license:fix' to automatically add them.`)
    process.exit(1) // Fails the script
  } else {
    console.log('✅ All source files have license headers!')
    process.exit(0)
  }
} else {
  console.log('\n✅ Header fix complete!')
}
