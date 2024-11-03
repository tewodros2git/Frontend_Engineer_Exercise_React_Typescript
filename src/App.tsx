import { Link, Route, BrowserRouter, Routes,useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { AuthProvider,useAuth } from './Auth/AuthContext';
import PrivateRoute from './Auth/PrivateRoute';

import CollegePage from './pages/College'
import CommutePage from './pages/Commute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import StateSearch from './pages/StateSearch'

export interface User {
    id: number
}

export interface WithUserProps {
    user: User | null
}


function Navbar() {
    const { logout } = useAuth(); 
    const navigate = useNavigate(); 

    const handleLogout = () => {
        logout();
        navigate('/login'); 
    };

    return (
        <nav style={{ borderBottom: 'solid 1px', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <Link to="/">Home</Link> |{' '}
            <Link to="/states">States Search Example</Link> |{' '}
            <Link to="/college">College Concentrations</Link> |{' '}
            <Link to="/commutes">Commutes</Link> |{' '}
            <Link to="/login">Login</Link> |{' '}
            <Link to="/signup">Signup</Link> |{' '}
            <button onClick={handleLogout}>Logout</button> {}
        </nav>
    );
}



function App() {

    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="App" style={{ margin: '1rem' }}>
                    <header className="App-header">
                        <h1>Focus Frontend Interview Exercise</h1>
                    </header>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route element={<PrivateRoute />}>
                            <Route path="/states" element={<StateSearch />} />
                            <Route path="/commutes" element={<CommutePage />} />
                            <Route path="/college" element={<CollegePage />} />
                        </Route>    
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                    </Routes>
                </div>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App
