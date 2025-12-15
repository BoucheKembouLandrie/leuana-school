import React, { useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab } from '@mui/material';

const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Rapports
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#2e7d32', // Green for Reports module
                        },
                    }}
                >
                    <Tab
                        label="Rapport Financier"
                        sx={{
                            '&.Mui-selected': { color: '#2e7d32' },
                            color: 'text.secondary'
                        }}
                    />
                    <Tab
                        label="Rapport de Note"
                        sx={{
                            '&.Mui-selected': { color: '#2e7d32' },
                            color: 'text.secondary'
                        }}
                    />
                </Tabs>
            </Box>

            <div role="tabpanel" hidden={activeTab !== 0}>
                {activeTab === 0 && (
                    <Box>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Rapport Financier
                            </Typography>
                            <Typography color="text.secondary">
                                Module en cours de développement...
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </div>

            <div role="tabpanel" hidden={activeTab !== 1}>
                {activeTab === 1 && (
                    <Box>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Rapport de Note
                            </Typography>
                            <Typography color="text.secondary">
                                Module en cours de développement...
                            </Typography>
                        </Paper>
                    </Box>
                )}
            </div>
        </Box>
    );
};

export default Reports;
