import React from 'react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import Navbar from './components/navbar.jsx';
import SearchDiv from './components/searchDiv.jsx';

function ExplanationDiv({text, imageURL, backgroundImageURL}) {
    // we can load images asynchrounously if needed
    return(
        <div id="explanation-div">
            <img src={backgroundImageURL} alt="" />
            <img src={imageURL} alt="" />
            <p>{text}</p>
        </div>
    );
}

export default function App() {

    return (
        <div id="app-body">
            <Navbar user="test" tokenNumber={1}/>

            <div id="content">
                <section id="explanation-section">
                    <ExplanationDiv text={<>Condividi le tue <strong>BlockNotes</strong>!</>} imageURL={null} backgroundImageURL={null} />
                    <ExplanationDiv text={<>Guadagna <strong>Tokenotes</strong></>} imageURL={null} backgroundImageURL={null} />
                    <ExplanationDiv text={<>Ottieni <strong>BlockNotes</strong> usando <strong>Tokenotes</strong></>} imageURL={null} backgroundImageURL={null} />
                </section>

                <section id="main-body">
                    <SearchDiv/>
                </section>
            </div>
        </div>
    );
} 

// Render your React component instead
const root = createRoot(document.getElementById('root'));
root.render(<App/>);