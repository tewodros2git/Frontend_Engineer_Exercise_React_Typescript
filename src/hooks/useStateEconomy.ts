import { useCallback, useEffect, useState } from 'react'

import client from '../api/client'
import { gql } from '@apollo/client'
import useStates from './useStates'

interface EmploymentSummary {
    topIndustryByEmployee: { industry: string; employedCount: number }
    topIndustryByAverageSalary: { industry: string; averageSalary: number }
}

interface InterstateTradeStateResult {
    name: string
    totalDollarAmount: number
    totalTons: number
    statesByDollars: { name: string; amount: number }[]
    statesByTons: { name: string; amount: number }[]
}

interface ProductionSummary {
    name: string
    totalDollarAmount: number
    totalTons: number
    productionTypeByDollars: { name: string; amount: number }[]
    productionTypeByTons: { name: string; amount: number }[]
}

export interface StateEconomyResult {
    id: string
    key: string
    name: string
    slug: string
    productionSummary?: ProductionSummary
    tradeSummary?: InterstateTradeStateResult
    employmentSummary?: EmploymentSummary
}

const useStateEconomy = () => {
    const { results: states } = useStates()
    const [results, setResults] = useState<StateEconomyResult[]>()
    const [summariesToFetch, setSummariesToFetch] = useState<{
        production: boolean
        employment: boolean
        trade: boolean
    }>({
        production: true,
        employment: true,
        trade: true,
    })
    const [nameSearchString, setNameSearchString] = useState<string>('')
    const clearFilter = useCallback(() => {
        setNameSearchString('')
    }, [])
    const search = useCallback((searchString: string) => {
        setNameSearchString(searchString)
    }, [])

    useEffect(() => {
        if (states) {
            const fetchData = async () => {
                const data = await client.query<{
                    states: StateEconomyResult[]
                }>({
                    query: gql`
                        query Query {
                            states(name: null) {
                                name
                                ${
                                    summariesToFetch.production
                                        ? `productionSummary {
                                    productionTypeByDollars {
                                        name
                                        amount
                                    }
                                    productionTypeByTons {
                                        amount
                                        name
                                    }
                                }`
                                        : ''
                                }
                                ${
                                    summariesToFetch.employment
                                        ? `employmentSummary {
                                    topIndustryByAverageSalary {
                                        averageSalary
                                        industry
                                    }
                                    topIndustryByEmployee {
                                        employedCount
                                        industry
                                    }
                                }`
                                        : ''
                                }
                                ${
                                    summariesToFetch.trade
                                        ? `tradeSummary {
                                    totalDollarAmount
                                    totalTons
                                    statesByDollars {
                                        amount
                                        name
                                    }
                                    statesByTons {
                                        amount
                                        name
                                    }
                                }`
                                        : ''
                                }
                            }
                        }
                    `,
                })
                setResults(data.data.states)
            }
            fetchData()
        }
    }, [states, summariesToFetch])

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
            summariesToFetch,
            setSummariesToFetch,
        }
    }

    return {
        results,
        clearFilter,
        search,
        nameFilter: nameSearchString,
        summariesToFetch,
        setSummariesToFetch,
    }
}

export default useStateEconomy
