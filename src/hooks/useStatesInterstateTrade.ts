import { useCallback, useEffect, useState } from 'react'
import useStates from './useStates'

export interface StateInterstateTradeResult {
    'Destination State': string
    Origin: string
    'Millions Of Dollars': number
    'Thousands Of Tons': number
}

const useStatesInterstateTrade = () => {
    const { results: states } = useStates()
    const [results, setResults] = useState<StateInterstateTradeResult[]>()
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
                const interstateDataPromises = states.map(async (state) => {
                    const response = await fetch(
                        `https://datausa.io/api/data?Origin%20State=${state.id}&measure=Millions%20Of%20Dollars,Thousands%20Of%20Tons&drilldowns=Destination%20State&year=latest`
                    )
                    const data = await response.json()
                    return data.data
                })
                const allStates = await Promise.all(interstateDataPromises)

                setResults(allStates.flat())
            }
            fetchData()
        }
    }, [states])

    if (nameSearchString.trim() !== '' && results) {
        return {
            results: results?.filter((result) =>
                result.Origin.toLowerCase().startsWith(
                    nameSearchString.toLowerCase()
                )
            ),
            clearFilter,
            search,
            nameFilter: nameSearchString,
        }
    }

    return { results, clearFilter, search, nameFilter: nameSearchString }
}

export default useStatesInterstateTrade
