import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DataTable from 'react-data-table-component';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DegreeData {
    area: string;
    year: string;
    numberAwarded: number;
}

const CollegePage: React.FC = () => {
    const [stateName, setStateName] = useState('');
    const [degreeData, setDegreeData] = useState<DegreeData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [viewMode, setViewMode] = useState<'table' | 'graph'>('table');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setStateName(event.target.value);
    };

    const fetchDegreeData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`http://localhost:4001/graphql`, {
                query: `
                    query AwardedDegrees($name: String!) {
                        states(name: $name) {
                            collegeConcentrations {
                                area
                                year
                                numberAwarded
                            }
                        }     
                    }
                `,
                variables: {
                    name: stateName,
                },
            });

            const rawData: DegreeData[] = response.data.data.states[0].collegeConcentrations;
            const aggregatedData = Object.values(
                rawData.reduce((acc, item) => {
                    const key = `${item.area}-${item.year}`;
                    if (!acc[key]) {
                        acc[key] = { ...item };
                    } else {
                        acc[key].numberAwarded += item.numberAwarded;
                    }
                    return acc;
                }, {} as Record<string, DegreeData>)
            );

            setDegreeData(aggregatedData);
        } catch (err) {
            setError('Error fetching data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            name: 'Concentration',
            selector: (row: DegreeData) => row.area,
            sortable: true,
        },
        {
            name: 'Year',
            selector: (row: DegreeData) => row.year,
            sortable: true,
        },
        {
            name: 'Number Awarded',
            selector: (row: DegreeData) => row.numberAwarded,
            sortable: true,
        },
    ];

    const chartData = {
        labels: degreeData.map((item) => item.area),
        datasets: [
            {
                label: 'Number Awarded',
                data: degreeData.map((item) => item.numberAwarded),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: `Degrees Awarded in ${stateName}` },
        },
    };

    return (
        <div>
            <h2>College Concentrations in {stateName}</h2>
            <input
                type="text"
                value={stateName}
                onChange={handleInputChange}
                placeholder="Enter state"
            />
            <button onClick={fetchDegreeData}>Fetch Data</button>

            <div>
                <button onClick={() => setViewMode('table')}>Table View</button>
                <button onClick={() => setViewMode('graph')}>Graph View</button>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {viewMode === 'table' && degreeData.length > 0 && (
                <DataTable
                    title="Degrees Awarded Over Time"
                    columns={columns}
                    data={degreeData}
                    pagination
                />
            )}

            {viewMode === 'graph' && degreeData.length > 0 && (
                <Bar data={chartData} options={chartOptions} />
            )}
        </div>
    );
};

export default CollegePage;
