import useStates, { StateRow } from '../hooks/useStates'

import DataTable from 'react-data-table-component'
import { Navigate } from 'react-router-dom'
import React from 'react'
import { WithUserProps } from '../App'

const columns = [
    {
        name: 'Id',
        selector: (row: StateRow) => row.id,
    },
    {
        name: 'Key',
        selector: (row: StateRow) => row.key,
    },
    {
        name: 'Name',
        selector: (row: StateRow) => row.name,
    },
    {
        name: 'Slug',
        selector: (row: StateRow) => row.slug,
    },
    {
        name: 'Example API Endpoint',
        cell: (row: StateRow) => (
            <a
                target="_blank"
                rel="noopener noreferrer"
                href={`https://datausa.io/api/data?Geography=${row.key}&Nativity=2&measure=Total%20Population,Total%20Population%20MOE%20Appx&drilldowns=Birthplace&properties=Country%20Code`}
            >
                Population Example
            </a>
        ),
    },
]
const StateSearch = () => {
    const { results, clearFilter, search, nameFilter } = useStates()

    if (!results) {
        return <div>'Loading states...'</div>
    }

    return (
        <div>
            <div>
                <label htmlFor="state">Search for a state</label>
                <input
                    value={nameFilter}
                    onChange={(evt) => search(evt.target.value)}
                    name="state"
                    type="text"
                />
                <button onClick={clearFilter}>Clear Search</button>
            </div>
            <DataTable
                title="State List"
                columns={columns}
                data={results}
                progressPending={results === undefined}
                pagination
            />
        </div>
    )
}

export default StateSearch
