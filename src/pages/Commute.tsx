import React, { useState } from 'react';
import axios from 'axios';

interface CommuteTime {
    travelTime: string;
    numberOfPeople: number;
    state: string;
    year: string;
}

interface CommuteMethod {
    method: string;
    numberOfCommuters: number;
}

interface CommuteData {
    commuteTimes: CommuteTime[];
    commuteMethods: CommuteMethod[];
}

const CommutePage: React.FC = () => {
    const [state1, setState1] = useState('');
    const [state2, setState2] = useState('');
    const [year, setYear] = useState('');
    const [commuteData, setCommuteData] = useState<CommuteData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'state1') setState1(value);
        if (name === 'state2') setState2(value);
        if (name === 'year') setYear(value);
    };

    const fetchCommuteData = async () => {
        if (!state1 || !state2 || !year) return;

        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`http://localhost:4001/graphql`, {
                query: `
                    query ExampleQuery {
                        states {
                            commuteTimes {
                                travelTime
                                numberOfPeople
                                state
                                year
                            }
                            commuteMethods {
                                method
                                numberOfCommuters
                            }
                        }
                    }
                `,
            });
            setCommuteData(response.data.data.states);
        } catch (err) {
            setError('Error fetching commute data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const state1Data = commuteData.find(data => data.commuteTimes[0]?.state === state1);
    const state2Data = commuteData.find(data => data.commuteTimes[0]?.state === state2);

    const calculateCommuteInfo = (stateData: CommuteData | undefined) => {
        if (!stateData) return { totalCommuters: 0, averageTime: 'N/A', popularMethod: 'N/A' };

        const totalCommuters = stateData.commuteTimes.reduce((sum, commute) => sum + commute.numberOfPeople, 0);
        const calculateAverageTime = (commuteTimes: CommuteTime[]) => {
            const numericTimes = commuteTimes.map(commute => {
                const { travelTime } = commute;
                
                if (travelTime.includes('-')) {
                    const [min, max] = travelTime.split('-').map(num => parseInt(num.trim()));
                    return (min + max) / 2; 
                }
                
                const singleValueMatch = travelTime.match(/\d+/);
                return singleValueMatch ? parseInt(singleValueMatch[0]) : 0;
            });
        
            const maxTime = Math.max(...numericTimes);
            const minTime = Math.min(...numericTimes);
        
            return (maxTime + minTime) / 2 || 'N/A'; 
        };
           

        const averageTime = calculateAverageTime(stateData.commuteTimes); 

        const methodCounts = stateData.commuteMethods.reduce((acc, method) => {
            acc[method.method] = (acc[method.method] || 0) + method.numberOfCommuters;
            return acc;
        }, {} as Record<string, number>);

        const popularMethod = Object.entries(methodCounts).reduce((prev, curr) => 
            curr[1] > prev[1] ? curr : prev
        )[0] || 'N/A';

        return { totalCommuters, averageTime, popularMethod };
    };

    const state1Info = calculateCommuteInfo(state1Data);
    const state2Info = calculateCommuteInfo(state2Data);

    return (
        <div>
            <h2>Compare Commute Information</h2>
            <input
                type="text"
                name="state1"
                value={state1}
                onChange={handleInputChange}
                placeholder="Enter first state"
            />
            <input
                type="text"
                name="state2"
                value={state2}
                onChange={handleInputChange}
                placeholder="Enter second state"
            />
            <input
                type="number"
                name="year"
                value={year}
                onChange={handleInputChange}
                placeholder="Enter year"
            />
            <button onClick={fetchCommuteData} disabled={!state1 || !state2 || !year}>
                Compare
            </button>
            <p></p>
            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            {state1Info && state2Info && (
                <table>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>{state1}</th>
                            <th>{state2}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Total Commuters</td>
                            <td>{state1Info.totalCommuters}</td>
                            <td>{state2Info.totalCommuters}</td>
                        </tr>
                        <tr>
                            <td>Avg Commute Time</td>
                            <td>{state1Info.averageTime} minutes</td>
                            <td>{state2Info.averageTime} minutes</td>
                        </tr>
                        <tr>
                            <td>Popular Commute</td>
                            <td>{state1Info.popularMethod}</td>
                            <td>{state2Info.popularMethod}</td>
                        </tr>
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CommutePage;
