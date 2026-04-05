import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { clearError, login } from '../store/slices/authSlice';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error, isAuthenticated } = useAppSelector(
        (state) => state.auth
    );

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        return () => {
            dispatch(clearError());
        };
    }, [dispatch]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const result = await dispatch(login({ email, password }));
        if (login.fulfilled.match(result)) {
            navigate('/', { replace: true });
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='card w-full max-w-sm bg-base-100 shadow-xl'>
                <div className='card-body'>
                    <div className='flex justify-center mb-2'>
                        <img
                            src='/pf360_logo.png'
                            alt='PF360 Logo'
                            className='h-32 w-32 object-contain'
                        />
                    </div>
                    <h2 className='card-title justify-center text-2xl font-extrabold'>
                        Sign in to your account
                    </h2>
                    <p className='text-center text-sm opacity-60'>
                        Or{' '}
                        <Link
                            to='/register'
                            className='link link-primary font-medium'
                        >
                            create a new account
                        </Link>
                    </p>

                    <form
                        className='mt-6 flex flex-col gap-4'
                        onSubmit={handleSubmit}
                    >
                        {error && (
                            <div role='alert' className='alert alert-error'>
                                <span>
                                    {typeof error === 'string'
                                        ? error
                                        : 'An error occurred'}
                                </span>
                            </div>
                        )}

                        <div className='form-control'>
                            <label className='label' htmlFor='email'>
                                <span className='label-text'>
                                    Email address
                                </span>
                            </label>
                            <input
                                id='email'
                                name='email'
                                type='email'
                                autoComplete='email'
                                required
                                className='input input-bordered w-full'
                                placeholder='Email address'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className='form-control'>
                            <label className='label' htmlFor='password'>
                                <span className='label-text'>Password</span>
                            </label>
                            <input
                                id='password'
                                name='password'
                                type='password'
                                autoComplete='current-password'
                                required
                                className='input input-bordered w-full'
                                placeholder='Password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type='submit'
                            disabled={loading}
                            className='btn btn-primary w-full mt-2'
                        >
                            {loading ? (
                                <span className='loading loading-spinner loading-sm' />
                            ) : null}
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
