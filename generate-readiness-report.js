#!/usr/bin/env node

/**
 * Production Readiness Report Generator CLI
 * 
 * This script generates a production readiness report for the current repository
 * by calling the backend API endpoint.
 * 
 * Usage:
 *   node generate-readiness-report.js [options]
 * 
 * Options:
 *   --owner <owner>       Repository owner (default: CLOCKWORK-TEMPTATION)
 *   --repo <repo>         Repository name (default: breakbreak)
 *   --path <path>         Repository path (default: current directory)
 *   --output <file>       Output file for the report (default: production-readiness-report.json)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  owner: 'CLOCKWORK-TEMPTATION',
  repo: 'breakbreak',
  path: process.cwd(),
  output: 'production-readiness-report.json',
  port: 3000,
  host: 'localhost',
};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  if (Object.prototype.hasOwnProperty.call(options, key)) {
    options[key] = value;
  }
}

console.log('🔍 جاري توليد تقرير جاهزية الإنتاج... | Generating Production Readiness Report...');
console.log(`   المالك | Owner: ${options.owner}`);
console.log(`   المستودع | Repo: ${options.repo}`);
console.log(`   المسار | Path: ${options.path}`);
console.log('');

// Make HTTP request to the API
const postData = JSON.stringify({
  owner: options.owner,
  repo: options.repo,
  repositoryPath: options.path,
});

const requestOptions = {
  hostname: options.host,
  port: options.port,
  path: '/readiness/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(requestOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      try {
        const report = JSON.parse(data);
        
        // Save to file
        fs.writeFileSync(options.output, JSON.stringify(report, null, 2));
        console.log('✅ تم توليد التقرير بنجاح! | Report generated successfully!');
        console.log(`   الملف | Output: ${options.output}`);
        console.log('');
        
        // Display summary
        if (report.metadata) {
          console.log('📊 الملخص | Summary:');
          console.log(`   المستودع | Repository: ${report.metadata.repository}`);
          console.log(`   التاريخ | Date: ${report.metadata.reportDate}`);
          console.log(`   اللغات | Languages: ${report.metadata.primaryLanguages.join(', ')}`);
          console.log('');
        }
        
        if (report.analysisData) {
          console.log('📦 تحليل المستودع | Repository Analysis:');
          console.log(`   package.json: ${report.analysisData.hasPackageJson ? '✓' : '✗'}`);
          console.log(`   Dockerfile: ${report.analysisData.hasDockerfile ? '✓' : '✗'}`);
          console.log(`   الاختبارات | Tests: ${report.analysisData.hasTests ? '✓' : '✗'}`);
          console.log(`   CI/CD: ${report.analysisData.hasCI ? '✓' : '✗'}`);
          console.log(`   README: ${report.analysisData.hasReadme ? '✓' : '✗'}`);
          console.log('');
        }
        
        if (report.prompt) {
          console.log('📝 الـ Prompt للذكاء الاصطناعي | AI Prompt:');
          console.log('   تم تضمين الـ prompt في التقرير.');
          console.log('   The generated prompt is included in the report.');
          console.log('   استخدمه مع ChatGPT أو Gemini أو Claude للحصول على تقييم كامل.');
          console.log('   Use it with ChatGPT, Gemini, or Claude to get a full assessment.');
          console.log('');
        }
        
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
        console.error('Response:', data);
        process.exit(1);
      }
    } else {
      console.error(`❌ Error: HTTP ${res.statusCode}`);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ خطأ في الاتصال بالـ API | Error connecting to the API:');
  console.error(`   ${error.message}`);
  console.error('');
  console.error('تأكد من تشغيل خادم الخلفية | Make sure the backend server is running:');
  console.error(`   cd apps/backend && pnpm run dev`);
  console.error('');
  process.exit(1);
});

req.write(postData);
req.end();
