import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { clearError, register } from '../store/slices/authSlice';

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password1, setPassword1] = useState('');
    const [password2, setPassword2] = useState('');
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
        const result = await dispatch(
            register({ username, email, password1, password2 })
        );
        if (register.fulfilled.match(result)) {
            navigate('/', { replace: true });
        }
    };

    return (
        <div className='min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8'>
            <div className='card w-full max-w-sm bg-base-100 shadow-xl'>
                <div className='card-body'>
                    <h2 className='card-title justify-center text-2xl font-extrabold'>
                        Create your account
                    </h2>
                    <p className='text-center text-sm opacity-60'>
                        Or{' '}
                        <Link
                            to='/login'
                            className='link link-primary font-medium'
                        >
                            sign in to existing account
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
                                        : Object.entries(
                                              error as Record<
                                                  string,
                                                  string | string[]
                                              >
                                          )
                                              .flatMap(([, msgs]) =>
                                                  Array.isArray(msgs)
                                                      ? msgs
                                                      : [String(msgs)]
                                              )
                                              .map((msg, i) => (
                                                  <p key={i}>{msg}</p>
                                              ))}
                                </span>
                            </div>
                        )}

                        <div className='form-control'>
                            <label className='label' htmlFor='username'>
                                <span className='label-text'>Username</span>
                            </label>
                            <input
                                id='username'
                                name='username'
                                type='text'
                                autoComplete='username'
                                required
                                className='input input-bordered w-full'
                                placeholder='Username'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

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
                            <label className='label' htmlFor='password1'>
                                <span className='label-text'>Password</span>
                            </label>
                            <input
                                id='password1'
                                name='password1'
                                type='password'
                                autoComplete='new-password'
                                required
                                className='input input-bordered w-full'
                                placeholder='Password'
                                value={password1}
                                onChange={(e) => setPassword1(e.target.value)}
                            />
                        </div>

                        <div className='form-control'>
                            <label className='label' htmlFor='password2'>
                                <span className='label-text'>
                                    Confirm Password
                                </span>
                            </label>
                            <input
                                id='password2'
                                name='password2'
                                type='password'
                                autoComplete='new-password'
                                required
                                className='input input-bordered w-full'
                                placeholder='Confirm Password'
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
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
                            {loading ? 'Creating account...' : 'Sign up'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Register;
