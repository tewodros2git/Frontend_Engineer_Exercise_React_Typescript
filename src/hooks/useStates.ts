import { useCallback, useEffect, useState } from 'react'

import client from '../api/client'
import { gql } from '@apollo/client'

export interface StateRow {
    id: string
    key: string
    name: string
    slug: string
}

const useStates = () => {
    const [results, setResults] = useState<StateRow[]>()
    const [nameSearchString, setNameSearchString] = useState<string>('')
    const clearFilter = useCallback(() => {
        setNameSearchString('')
    }, [])
    const search = useCallback((searchString: string) => {
        setNameSearchString(searchString)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            const data = await client.query({
                query: gql`
                    query Query {
                        states(name: null) {
                            id
                            key
                            slug
                            name
                        }
                    }
                `,
            })
            setResults(data.data.states)
        }
        fetchData()
    }, [])

    if (nameSearchString.trim() !== '' && results) {
        return {
            results: results?.filter((result) =>
                result.name
                    .toLowerCase()
                    .startsWith(nameSearchString.toLowerCase())
            ),
            clearFilter,
            search,
            nameFilter: nameSearchString,
        }
    }

    return { results, clearFilter, search, nameFilter: nameSearchString }
}

export default useStates
