import axios from 'axios';

const testCreate = async () => {
    try {
        console.log('Testing rule creation...');

        const response = await axios.post('http://localhost:5005/api/exam-rules', {
            category: 'Non redoublant(e)',
            min_average: 0,
            max_average: 7.99,
            min_absence: 0,
            max_absence: 1000,
            status: 'Exclu(e)'
        }, {
            headers: {
                'x-school-year-id': '4'
            }
        });

        console.log('✅ SUCCESS:', response.data);
    } catch (error: any) {
        console.log('❌ ERROR Status:', error.response?.status);
        console.log('❌ ERROR Message:', error.response?.data?.message);
        console.log('❌ Full Error:', error.response?.data);
    }
};

testCreate();
