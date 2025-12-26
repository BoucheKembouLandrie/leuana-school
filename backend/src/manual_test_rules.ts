import axios from 'axios';

const testCreate = async () => {
    try {
        console.log('Testing Create Rule (Manual Replication)...');
        // Based on User Screenshot:
        // Categorie: Non redoublant(e)
        // Moyenne: 0 - 7.99
        // Absences: 0 - 999
        // Status: Exclu(e)

        const res = await axios.post('http://localhost:5005/api/exam-rules', {
            category: 'Non redoublant(e)',
            min_average: 0,
            max_average: 7.99,
            min_absence: 0,
            max_absence: 999,
            status: 'Exclu(e)'
        }, {
            headers: {
                'x-school-year-id': '4' // Assuming 4 is active year
            }
        });
        console.log('Success:', res.data);
    } catch (error: any) {
        console.log('Error Status:', error.response?.status);
        console.log('Error Data:', error.response?.data);
    }
};

testCreate();
