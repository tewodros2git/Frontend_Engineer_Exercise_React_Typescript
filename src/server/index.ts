import { User, createSchema } from './db'
import express, { NextFunction, Request, Response } from 'express'
import { maxBy, sortBy } from 'lodash'
import passportLocal, { IVerifyOptions } from 'passport-local'

import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginCacheControl } from '@apollo/server/plugin/cacheControl'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import bodyParser from 'body-parser'
import cors from 'cors'
import { expressMiddleware } from '@apollo/server/express4'
import fetch from 'node-fetch'
import gql from 'graphql-tag'
import http from 'http'
import passport from 'passport'
import responseCachePlugin from '@apollo/server-plugin-response-cache'
import session from 'express-session'

const LocalStrategy = passportLocal.Strategy

let states: State[] | null = null
const commuteMethods: { [key: string]: CommuteMethodResult[] } = {}
const concentrations: { [key: string]: ConcentrationResult[] } = {}
const commuteTimes: { [key: string]: CommuteTimeResult[] } = {}

const typeDefs = gql`
    # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.
    enum CacheControlScope {
        PUBLIC
        PRIVATE
    }

    directive @cacheControl(
        maxAge: Int
        scope: CacheControlScope
        inheritMaxAge: Boolean
    ) on FIELD_DEFINITION | OBJECT | INTERFACE | UNION

    type ConcentrationResult @cacheControl(maxAge: 3600) {
        area: String
        major: String
        degreeType: String
        numberAwarded: Int
        state: String
        year: String
    }

    type CommuteTimeResult @cacheControl(maxAge: 3600) {
        travelTime: String
        numberOfPeople: Int
        state: String
        year: String
    }

    type CommuteMethodResult @cacheControl(maxAge: 3600) {
        method: String
        state: String
        year: String
        numberOfCommuters: Int
    }

    # State type
    type State @cacheControl(maxAge: 3600) {
        id: String
        key: String
        name: String
        slug: String
        collegeConcentrations(year: String): [ConcentrationResult]
        commuteTimes(year: String): [CommuteTimeResult]
        commuteMethods(year: String): [CommuteMethodResult]
    }

    type Query {
        states(name: String): [State]
    }
`

interface State {
    id: string
    key: string
    name: string
    slug: string
}

interface Concentrations {
    CIP2: string
    CIP4: string
    CIP6: string
    Year: string
    Degree: string
    Geography: string
    Completions: number
}

interface ConcentrationResult {
    area: string
    major: string
    degreeType: string
    numberAwarded: number
    state: string
    year: string
}

interface CommuteMethods {
    Group: string
    Geography: string
    Year: string
    'Commute Means': number
}

interface CommuteMethodResult {
    method: string
    state: string
    year: string
    numberOfCommuters: number
}

interface CommuteTime {
    'Travel Time': string
    'Commuter Population': number
    Geography: string
    Year: string
}

interface CommuteTimeResult {
    travelTime: string
    numberOfPeople: number
    state: string
    year: string
}

const resolvers = {
    State: {
        commuteTimes: async (parent: State, args: { year?: string }) => {
            const { id } = parent
            const { year } = args
            let results = commuteTimes[id]
            if (!results) {
                const response = await fetch(
                    `https://datausa.io/api/data?measure=Commuter%20Population,Commuter%20Population%20Moe&geo=${id}&drilldowns=Travel%20Time`
                )
                const data = await response.json()
                const rawResults: CommuteTime[] = data.data
                results = rawResults.map((result) => {
                    return {
                        travelTime: result['Travel Time'],
                        numberOfPeople: result['Commuter Population'],
                        state: result.Geography,
                        year: result.Year,
                    } as CommuteTimeResult
                })
            }
            if (year) {
                return results.filter((r) => r.year == year)
            }
            return results
        },
        commuteMethods: async (parent: State, args: { year?: string }) => {
            const { id } = parent
            const { year } = args
            let results = commuteMethods[id]
            if (!results) {
                const response = await fetch(
                    `https://datausa.io/api/data?measure=Commute%20Means,Commute%20Means%20Moe&geo=${id}&drilldowns=Group`
                )
                const data = await response.json()
                const rawResults: CommuteMethods[] = data.data
                results = rawResults.map((result) => {
                    return {
                        method: result.Group,
                        state: result.Geography,
                        year: result.Year,
                        numberOfCommuters: result['Commute Means'],
                    } as CommuteMethodResult
                })
            }

            if (year) {
                return results.filter((r) => r.year == year)
            }
            return results
        },
        collegeConcentrations: async (
            parent: State,
            args: { year?: string }
        ) => {
            const { id } = parent
            const { year } = args
            let results = concentrations[id]
            if (!results) {
                const response = await fetch(
                    `https://datausa.io/api/data?Geography=${id}&measure=Completions&drilldowns=CIP6&parents=true&Degree=5`
                )
                const data = await response.json()
                const rawResults: Concentrations[] = data.data

                results = rawResults.map((result) => {
                    return {
                        area: result.CIP4,
                        major: result.CIP6,
                        degreeType: result.Degree,
                        state: result.Geography,
                        year: result.Year,
                        numberAwarded: result.Completions,
                    } as ConcentrationResult
                })
            }

            if (year) {
                return results.filter((r) => r.year == year)
            }
            return results
        },
    },
    Query: {
        states: async (parent: unknown, args: { name?: string }) => {
            const { name } = args
            if (states) {
                if (name) {
                    return states.filter((state: { name: string }) =>
                        state.name.toLowerCase().startsWith(name.toLowerCase())
                    )
                }
                return states
            } else {
                const response = await fetch(
                    'https://datausa.io/api/searchLegacy?dimension=Geography&hierarchy=State&limit=50000'
                )
                const data: any = await response.json()
                states = data.results
                if (name) {
                    return data.results.filter((state: { name: string }) =>
                        state.name.toLowerCase().startsWith(name.toLowerCase())
                    )
                }
                return data.results
            }
        },
    },
}

passport.deserializeUser(async (id: number, done) => {
    const user = await User.query().findById(id).execute()
    done(undefined, user)
})

passport.serializeUser((user, done) => {
    // @ts-ignore
    done(undefined, user.id)
})

passport.use(
    new LocalStrategy(
        { usernameField: 'username', passwordField: 'password' },
        async (username, password, done) => {
            const userStmt = await User.query()
                .where('username', '=', username)
                .where('password', '=', password)
                .execute()
            const user = userStmt[0]
            if (!user) {
                return done(undefined, false, {
                    message: 'Invalid credentials',
                })
            }

            return done(undefined, user)
        }
    )
)

const signup = async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body
    const existingUser = await User.query()
        .where('username', '=', username)
        .execute()
    if (existingUser.length > 1) {
        return res.status(400).json({ message: 'User already exists' })
    }
    await User.query().insert({ username, password }).execute()
    passport.authenticate(
        'local',
        (err: Error, user: User, info: IVerifyOptions) => {
            if (err) {
                return next(err)
            }
            if (!user) {
                return res.sendStatus(403)
            }
            return req.logIn(user, () => {
                return res.sendStatus(204)
            })
        }
    )(req, res, next)
}

const login = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
        'local',
        (err: Error, user: User, info: IVerifyOptions) => {
            if (err) {
                return next(err)
            }
            if (!user) {
                return res.sendStatus(403)
            }
            return req.logIn(user, () => {
                const session = req.session
                // @ts-ignore
                session.userId = user.id
                return req.session.save(() => {
                    return res.sendStatus(204)
                })
            })
        }
    )(req, res, next)
}

const logout = (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    return req.logOut((err) => {
        return res.sendStatus(204)
    })
}

const sessionHandler = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).send(req.user || {})
}

async function startServer() {
    const app = express()
    app.use(bodyParser.json())
    app.use(
        cors({
            credentials: true,
            origin: [
                'http://localhost:3000',
                'https://studio.apollographql.com',
            ],
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            preflightContinue: false,
            optionsSuccessStatus: 204,
        })
    )
    app.use(
        session({
            resave: true,
            saveUninitialized: true,
            secret: 'abc',
            name: 'test-app.sid',
            cookie: {
                sameSite: 'lax',
            },
        })
    )
    app.use(passport.initialize())
    app.use(passport.session())
    app.use((req, res, next) => {
        res.locals.user = req.user
        next()
    })
    app.post('/signup', signup)
    app.post('/login', login)
    app.get('/logout', logout)
    app.get('/session', sessionHandler)
    const httpServer = http.createServer(app)
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            ApolloServerPluginCacheControl({ defaultMaxAge: 60 * 60 }), //one hour
            responseCachePlugin(),
        ],
    })
    await createSchema()
    await server.start()
    app.use(
        '/graphql',
        cors<cors.CorsRequest>(),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => ({
                token: req.headers.token,
                getUser: () => req.user,
                logout: () => req.logout(),
            }),
        })
    )
    await new Promise<void>((resolve) =>
        httpServer.listen({ port: 4001 }, resolve)
    )
    console.log(`🚀 Server ready at http://localhost:4001/graphql`)
}

startServer()
