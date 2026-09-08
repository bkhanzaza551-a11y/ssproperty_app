const https = require('https');

const options = {
    headers: {
        'User-Agent': 'Node.js'
    }
};

https.get('https://api.github.com/repos/bkhanzaza551-a11y/ssproperty_app/actions/runs?per_page=1', options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const runs = JSON.parse(data);
            if (runs.workflow_runs && runs.workflow_runs.length > 0) {
                const run = runs.workflow_runs[0];
                console.log(`LATEST_RUN_ID: ${run.id}`);
                console.log(`STATUS: ${run.status}`);
                console.log(`CONCLUSION: ${run.conclusion}`);
                console.log(`URL: ${run.html_url}`);
            } else {
                console.log('No runs found.');
            }
        } catch (e) {
            console.error(e);
        }
    });
});
