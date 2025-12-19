
import { createSchoolYear, deleteSchoolYear } from './controllers/SchoolYearController';
import { Student, Grade, SchoolYear, Class } from './models';
import sequelize from './config/database';
import { Request } from 'express';

const MOCK_REQ = (body: any = {}, params: any = {}) => ({ body, params } as unknown as Request);
const MOCK_RES = () => {
    const res: any = {};
    res.status = (code: number) => {
        console.log(`[RES] Status: ${code}`);
        res.statusCode = code;
        return res;
    };
    res.json = (data: any) => {
        console.log(`[RES] Data:`, JSON.stringify(data));
        res.data = data;
        return res;
    };
    return res;
};

async function simulate() {
    console.log('--- STARTING SIMULATION ---');
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 0. Cleanup Previous Run
        const existing = await SchoolYear.findOne({ where: { name: '2099-2100' } });
        if (existing) {
            console.log('Cleanup: Deleting existing 2099-2100...');
            const reqDel = MOCK_REQ({}, { id: existing.id });
            const resDel = MOCK_RES();
            await deleteSchoolYear(reqDel, resDel);
        }

        // 1. Create Year
        console.log('1. Creating Year 2099-2100...');
        const reqCreate = MOCK_REQ({ name: '2099-2100' });
        const resCreate = MOCK_RES();

        try {
            await createSchoolYear(reqCreate, resCreate);
        } catch (e) {
            console.error('CRITICAL: createSchoolYear threw:', e);
            process.exit(1);
        }

        const newYear = resCreate.data;
        if (!newYear || !newYear.id) {
            console.error('FAILURE: Year creation returned no ID.');
            process.exit(1);
        }
        console.log(`Year Created: ID ${newYear.id}`);

        // 2. Add Data
        console.log('2. Seeding Data...');
        try {
            const cls = await Class.create({
                name: 'TestClass',
                libelle: 'LC',
                niveau: '6eme',
                annee: '2099-2100', // Matches format?
                school_year_id: newYear.id
            });
            console.log('Class Created.');

            await Student.create({
                nom: 'Test', prenom: 'Student', matricule: '123',
                date_naissance: new Date(), lieu_naissance: 'Bamako',
                sexe: 'M', classe_id: cls.id, school_year_id: newYear.id
            });
            console.log('Student Created.');
        } catch (e: any) {
            console.error('Seeding failed:', e.name, e.message);
            // Verify validation
            if (e.errors) e.errors.forEach((err: any) => console.log(err.message));
            process.exit(1);
        }

        // 3. Verify Before Delete
        const countBefore = await Student.count({ where: { school_year_id: newYear.id } });
        console.log(`Students count before: ${countBefore}`);
        if (countBefore === 0) { console.error('Data not seeded!'); process.exit(1); }

        // 4. Delete
        console.log('3. Deleting Year...');
        const reqDelete = MOCK_REQ({}, { id: newYear.id });
        const resDelete = MOCK_RES();
        await deleteSchoolYear(reqDelete, resDelete);

        // 5. Verify After Delete
        console.log('4. Verifying Cleanup...');
        const countAfter = await Student.count({ where: { school_year_id: newYear.id } });
        const yearCheck = await SchoolYear.findByPk(newYear.id);

        console.log(`Students count after: ${countAfter}`);
        console.log(`Year exists after: ${!!yearCheck}`);

        if (countAfter === 0 && !yearCheck) {
            console.log('SUCCESS: FULL CLEANUP CONFIRMED.');
        } else {
            console.error('FAILURE: Data or Year persists.');
        }

        process.exit(0);

    } catch (e) {
        console.error('GLOBAL ERROR:', e);
        process.exit(1);
    }
}
simulate();
