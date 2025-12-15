import './models'; // Initialize associations
import { getSubjectStats } from './controllers/gradeController';
import { Request, Response } from 'express';

// Mock objects
const req: any = {
    query: {
        eleve_id: '1', // Assuming ID 1 exists based on previous debug
        evaluation: 'Evaluation 1',
        classe_id: '1'
    }
};

const res: any = {
    json: (data: any) => {
        console.log('Response JSON:', JSON.stringify(data, null, 2));
    },
    status: (code: number) => {
        console.log('Response Status:', code);
        return res;
    }
};

console.log('Testing getSubjectStats with:', req.query);
getSubjectStats(req, res);
