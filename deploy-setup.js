#!/usr/bin/env node

/**
 * Read-Buddy Deployment Setup Script
 * This script helps verify your environment configuration for Netlify deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Read-Buddy Deployment Setup');
console.log('================================\n');

// * Check if required files exist
const requiredFiles = [
  'netlify.toml',
  'netlify/functions/server.js',
  'package.json',
  'Back-end/js/server.js'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are present.');
  process.exit(1);
}

console.log('\n✅ All required files are present!');

// * Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['start', 'build', 'dev'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ ${script}: ${packageJson.scripts[script]}`);
    } else {
      console.log(`❌ Missing script: ${script}`);
    }
  });
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// * Check Netlify configuration
console.log('\n🌐 Checking Netlify configuration...');
try {
  const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
  
  if (netlifyConfig.includes('[build]')) {
    console.log('✅ Build configuration found');
  } else {
    console.log('❌ Build configuration missing');
  }
  
  if (netlifyConfig.includes('[[redirects]]')) {
    console.log('✅ Redirect rules found');
  } else {
    console.log('❌ Redirect rules missing');
  }
  
  if (netlifyConfig.includes('[[headers]]')) {
    console.log('✅ Security headers found');
  } else {
    console.log('❌ Security headers missing');
  }
} catch (error) {
  console.log('❌ Error reading netlify.toml:', error.message);
}

// * Check Netlify function
console.log('\n⚡ Checking Netlify function...');
try {
  const functionCode = fs.readFileSync('netlify/functions/server.js', 'utf8');
  
  if (functionCode.includes('exports.handler')) {
    console.log('✅ Function handler found');
  } else {
    console.log('❌ Function handler missing');
  }
  
  if (functionCode.includes('process.env.DATABASE_URL')) {
    console.log('✅ Database configuration found');
  } else {
    console.log('❌ Database configuration missing');
  }
  
  if (functionCode.includes('corsHeaders')) {
    console.log('✅ CORS configuration found');
  } else {
    console.log('❌ CORS configuration missing');
  }
} catch (error) {
  console.log('❌ Error reading Netlify function:', error.message);
}

console.log('\n🎯 Next Steps:');
console.log('1. Set up your Supabase project and get your database credentials');
console.log('2. Create a .env file using the env.template as a guide');
console.log('3. Connect your GitHub repository to Netlify');
console.log('4. Set environment variables in Netlify dashboard');
console.log('5. Deploy your site!');
console.log('\n📖 For detailed instructions, see DEPLOYMENT.md');

console.log('\n✨ Setup verification complete!');
