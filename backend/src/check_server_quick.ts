
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 2000);
const API_URL = 'http://localhost:5000/api';

async function run() {
    try {
        console.log('Fetching...');
        const res = await fetch(`${API_URL}/debug-db`, { signal: controller.signal });
        console.log('Status:', res.status);
        console.log(await res.json());
    } catch (e: any) {
        console.log('Error:', e.name, e.message);
    } finally {
        clearTimeout(timeoutId);
    }
}
run();
