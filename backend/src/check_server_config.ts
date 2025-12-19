
const API_URL = 'http://localhost:5000/api';
async function run() {
    try {
        console.log('Fetching Server DB info...');
        const res = await fetch(`${API_URL}/debug-db`);
        if (!res.ok) {
            console.log('Failed:', res.status, await res.text());
            return;
        }
        console.log(await res.json());
    } catch (e) { console.error(e); }
}
run();
