/* eslint-disable no-unused-vars */

export default function Navbar({user, tokenNumber= 0}) {

    return (
        <nav id="navbar">
            <div id="logo-wrapper">
                <img src="" alt="" id="logo"/>
            </div>
            
            <ul id="nav-links">
                <li>
                    <a href="#explore">Esplora</a>
                </li>


                <li>
                    <a href="#sell">Vendi</a>
                </li>
            </ul>

            <div id="tokenotes-counter">
                <img src="" alt="" />

                <p>
                    {tokenNumber ? tokenNumber : '0'}
                </p>
            </div>

            <div id="login-wrapper">
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