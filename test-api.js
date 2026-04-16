const ATLAS_API_KEY = 'YOUR_API_KEY_HERE'; // Replace with your actual key
const url = 'https://api.recruitwithatlas.com/api/v1/projects?state=active&per_page=5';

console.log('Testing Atlas API connection...');
console.log('URL:', url);
console.log('Key:', ATLAS_API_KEY ? 'Present' : 'Missing');
