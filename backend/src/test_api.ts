import axios from 'axios';

const testCreate = async () => {
    try {
        console.log('Testing Create Rule...');
        const res = await axios.post('http://localhost:5005/api/exam-rules', {
            category: 'Test',
            min_average: 0,
            max_average: 5,
            min_absence: 0,
            max_absence: 10,
            status: 'Test'
        }, {
            headers: {
                'x-school-year-id': '4' // Assuming 4 is the active year ID based on previous logs
            }
        });
        console.log('Success:', res.data);
    } catch (error: any) {
        console.log('Error:', error.response?.data || error.message);
    }
};

testCreate();
