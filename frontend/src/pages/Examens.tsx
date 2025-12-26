import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import EvaluationsTab from './EvaluationsTab';
import GradesTab from './GradesTab';
import PrintingTab from './PrintingTab';
import ConfigurationsTab from './ConfigurationsTab';

const Examens: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#d32f2f', // Red color to match Exams theme
                        },
                    }}
                >
                    <Tab
                        label="Évaluations"
                        sx={{
                            '&.Mui-selected': { color: '#d32f2f', fontWeight: 'bold' },
                            color: 'text.secondary'
                        }}
                    />
                    <Tab
                        label="Configurations"
                        sx={{
                            '&.Mui-selected': { color: '#d32f2f', fontWeight: 'bold' },
                            color: 'text.secondary'
                        }}
                    />
                    <Tab
                        label="Notes"
                        sx={{
                            '&.Mui-selected': { color: '#d32f2f', fontWeight: 'bold' },
                            color: 'text.secondary'
                        }}
                    />
                    <Tab
                        label="Impression"
                        sx={{
                            '&.Mui-selected': { color: '#d32f2f', fontWeight: 'bold' },
                            color: 'text.secondary'
                        }}
                    />
                </Tabs>
            </Box>

            <div role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && <EvaluationsTab />}
            </div>
            <div role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && <ConfigurationsTab />}
            </div>
            <div role="tabpanel" hidden={activeTab !== 2}>
                {activeTab === 2 && <GradesTab />}
            </div>
            <div role="tabpanel" hidden={activeTab !== 3}>
                {activeTab === 3 && <PrintingTab />}
            </div>
        </Box>
    );
};

export default Examens;
