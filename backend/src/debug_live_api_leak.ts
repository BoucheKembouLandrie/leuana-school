
const API_URL = 'http://localhost:5000/api';

async function check(label: string, yearId: string | null) {
    console.log(`\n--- Checking ${label} (Header: ${yearId}) ---`);
    try {
        const headers: any = {};
        if (yearId) headers['x-school-year-id'] = yearId;

        const res = await fetch(`${API_URL}/expenses`, { headers });
        console.log(`Status: ${res.status}`);

        if (res.ok) {
            const data = await res.json();
            console.log(`Count: ${Array.isArray(data) ? data.length : 'Not Array'}`);
            if (Array.isArray(data) && data.length > 0) {
                console.log('Sample[0] ID:', data[0].id, 'YearID:', data[0].school_year_id);
            }
        } else {
            console.log('Error Body:', await res.text());
        }
    } catch (e: any) {
        console.log('Fetch Error:', e.message);
    }
}

async function run() {
    // 1. Check with NO header (Should match 400 Bad Request)
    await check('NO HEADER', null);

    // 2. Check with OLD Year ID (Assume 5 or whatever was seeding)
    // We need to guess an ID that has data. Let's try 1 to 10.
    for (let i = 1; i <= 5; i++) {
        await check(`YEAR ID ${i}`, String(i));
    }

    // 3. Check with a "New" theoretical ID (e.g. 999)
    await check('NEW YEAR ID 999', '999');
}

run();
