
const API_URL = 'http://localhost:5000/api';

async function checkIsolation() {
    try {
        console.log('--- Authenticating ---');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'temp_debug_admin', password: 'temp123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const { token } = await loginRes.json();
        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        console.log('--- Checking School Years ---');
        const yearsRes = await fetch(`${API_URL}/school-years`, { headers: authHeaders });

        if (!yearsRes.ok) {
            console.error('Failed to fetch years:', await yearsRes.text());
            return;
        }

        const years = await yearsRes.json();
        console.log('Raw Years Response:', JSON.stringify(years).substring(0, 200));
        if (!Array.isArray(years)) {
            console.error('Error: Years is not an array.');
            return;
        }
        console.log(`Found ${years.length} school years.`);

        const endpoints = [
            { name: 'Expenses', url: '/expenses' },
            { name: 'Evaluations', url: '/evaluations' }
        ];

        for (const year of years) {
            console.log(`\nTesting Year: ${year.name} (ID: ${year.id})`);

            for (const endpoint of endpoints) {
                try {
                    const res = await fetch(`${API_URL}${endpoint.url}`, {
                        headers: {
                            ...authHeaders,
                            'x-school-year-id': year.id.toString()
                        }
                    });

                    if (res.status !== 200) {
                        const errText = await res.text();
                        console.error(`  [${endpoint.name}]: Failed - Status ${res.status}: ${errText}`);
                        continue;
                    }

                    const data = await res.json();
                    console.log(`  [${endpoint.name}]: Returned ${data.length} records.`);

                    if (data.length > 0) {
                        const sample = data[0];
                        console.log(`    Sample ID: ${sample.id}`);
                        if (sample.school_year_id) {
                            console.log(`    Record SchoolYearID: ${sample.school_year_id}`);
                            if (sample.school_year_id !== year.id) {
                                console.error(`    🔴 CRITICAL FAIL: Record belongs to Year ${sample.school_year_id} but was returned for Year ${year.id}`);
                            } else {
                                console.log(`    ✅ Match: Record belongs to this year.`);
                            }
                        } else {
                            console.warn(`    ⚠️ Record missing school_year_id in response.`);
                            // If missing, we can't verify, but it's suspicious if they are unique per year
                        }
                    }
                } catch (e: any) {
                    console.error(`  [${endpoint.name}]: Failed - ${e.message}`);
                }
            }
        }

    } catch (err) {
        console.error('Script failed:', err);
    }
}

checkIsolation();
