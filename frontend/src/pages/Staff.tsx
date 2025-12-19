import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import Teachers from './Teachers';
import Administration from './Administration';

const Staff: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#c2185b', // Pink for Staff (Admin color)
                        },
                    }}
                >
                    <Tab
                        label="Enseignants"
                        sx={{
                            '&.Mui-selected': { color: '#c2185b' },
                            color: 'text.secondary'
                        }}
                    />
                    <Tab
                        label="Administration"
                        sx={{
                            '&.Mui-selected': { color: '#c2185b' },
                            color: 'text.secondary'
                        }}
                    />
                </Tabs>
            </Box>

            <div role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && (
                    <Box>
                        <Teachers />
                    </Box>
                )}
            </div>

            <div role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && (
                    <Box>
                        <Administration />
                    </Box>
                )}
            </div>
        </Box>
    );
};

export default Staff;
