/* eslint-disable no-unused-vars */
import { useState } from 'react';

export default function Navbar() {
    const [user, setUser] = useState(null);
    const [tokenNumber, setTokenNumber] = useState(0);

    return (
        <nav>
            <div>
                <img src="" alt="" />
            </div>
            
            <ul>
                <li>
                    <a href="#explore">Esplora</a>
                </li>


                <li>
                    <a href="#sell">Vendi</a>
                </li>
            </ul>

            <div>
                <img src="" alt="" />

                <p>
                    {tokenNumber ? tokenNumber : '0'}
                </p>
            </div>

            <div>
                <button>
                    <img src="" alt="" />

                    <p>
                        {user ? user : 'Login'}
                    </p>
                </button>
            </div>
        </nav>
    );
}