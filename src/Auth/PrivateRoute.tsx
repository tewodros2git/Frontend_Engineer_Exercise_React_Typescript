import React from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

const PrivateRoute = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogin = () => {
        navigate('/login'); 
    };

    if (!isAuthenticated) {
        return (
            <div>
                <h2>Login to view this page.</h2>
                <button onClick={handleLogin}>Login</button>
                <p>
                    If you don't have an account, <Link to="/signup">signup</Link>.
                </p>
            </div>
        );
    }

    return <Outlet />; 
};

export default PrivateRoute;
