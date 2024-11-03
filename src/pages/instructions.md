# Exercises

The data is all publicly available at <https://datausa.io/>, which is powered by a public API that can be accessed without an API key. The goal of these exercises is to write implementations that match the acceptance criteria.  You are welcome to spend as much time on the exercises as you would like, but they all should be completable in around an hour.

## Setup

- `npm install` : downloads all the dependencies for the app
- `npm run server` : starts the backend API.
- `npm start` : starts the frontend React app. Changes will cause a reload

**Note: changes are not required to the server, but you will need it running as the the exercises ask you to fetch data from it.**

## Helpful hints

- After starting the server, the graphql schema and returned data can be visited by going to http://localhost:4001/graphql.  You'll be able to test sample queries to explore how the data is structured
- The server is setup to accept the query parameters
  - Data can be filtered by passing a `name` parameter to the `state` resolver to select a state and a `year` parameter method can be passed to the other resolvers to select a specific year of data
  - Your implementation should make use of these parameters rather than pulling all the data and filtering in the browser
- The state search component is already implemented and can provide some examples of how to query the data

## 1. Create a login flow and restrict access to the existing pages when a user is not logged in

Acceptance Criteria:

- As a user, I should be able to sign up for an account and access the other pages
  - To sign up, I need to enter a username and password; implemented at <http://localhost:3000/signup>
  - The sign up form should ask the user to confirm the password
- As as a user, I should be able to login and be shown an error message if the username or password are wrong
- As a user, I should only be able to access the home, login and signup routes (`/`, `/login`, `/signup`) if not logged in; if the user accesses any other route they should be directed to `/login`
- As a user, if I am logged in I should be redirected to `/` if I navigate to `/login` or `/signup`
- As a user, I should be told when signing up if that username is already in use
- As a user, I should be able to log out and be redirected to `/`

Implementation Notes:

- The endpoint for signing up (`localhost:4001/signup`), logging out (`localhost:4001/logout`), logging in (`localhost:4001/login`) already exists
  - Both login and signup expects a POST body of shape `{username: <USERNAME>, password: <PASSWORD>}`
  - The logout endpoint is a GET
- An endpoint exists at `localhost:4001/session` for checking if the the user is authenticated

## 2. Display information on how awarded degrees have changed over time

Acceptance Criteria:

- As a user, I would like to be able to enter the state that I'm interested in
- As a user, I would like to see the name of the college concentration, the number of people awarded it and the year

Implementation notes:

- You are welcome to choose whatever visualization method you like to use (i.e. graph, table, etc.)

## 3. Compare and contrast commute information for two states for a single year

### Acceptance Criteria

- As a user, I would like to be able to enter two states and the year that I would like to compare and contrast
- As a user, I would like to see which state has the longer average commute time
- As a user, I would like to see the most popular commute method for the selected state
- As a user, I would like to see the total number of commuters per state

Implementation notes:

- The user should only be able to search after entering in all the required info

## Troubleshooting

- If you encounter an issue fetching a data from the API, it is possible that you've hit the rate limiting implemented by datausa.io. To resolve it, simply visit <https://datausa.io/api/data?Origin%20State=04000US51&measure=Millions%20Of%20Dollars,Thousands%20Of%20Tons&drilldowns=Destination%20State&year=latest> directly and complete the captcha.
  - The API results are cached on the server, so the recommendation is to avoid restarting.
- If you encounter an issue with `yarn install` while installing sqlite3 (likely only if you have an M1 machine), it is likely caused by using the wrong version of python. To fix it run, `yarn install -python=/usr/bin/python2`
