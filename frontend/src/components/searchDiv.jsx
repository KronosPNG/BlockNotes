import React, {useState} from 'react';

export function InputText({placeholderText, inputName}) {
    return (
        <div className="input-text">
            <label htmlFor={inputName}>{inputName}</label>
            <input name={inputName} type="text" placeholder={placeholderText}/>
        </div>
    );
}

export function MinMaxInput({minPlaceholder, maxPlaceholder, inputName, imgURL}) {
    return (
        <div className="min-max-input">
            <label htmlFor={inputName}>{inputName}</label>
            <input name={inputName + "Min"} type="number" placeholder={minPlaceholder}/>
            <input name={inputName + "Max"} type="number" placeholder={maxPlaceholder}/>
            <img src={imgURL} alt="Tokenotes" />
        </div>
    );    
}

export function FilterButton({buttonText}) {
    return (
        <div className="filter-button-wrapper">
            <label htmlFor={buttonText}></label>
            <input type="checkbox" name={buttonText} checked/>
        </div>
    );
}

export function FilterDiv() {
    return (
        <div className="filters">
            <form action="" method="post">
                <h3>Filtri</h3>

                <InputText placeholderText="Cerca titolo..." inputName="Titolo"/>
                <InputText placeholderText="Cerca autore..." inputName="Autore"/>
                <MinMaxInput minPlaceholder="Min" maxPlaceholder="Max" inputName="Costo" imgURL=""/>
                
                <div id="filter-buttons-div">
                    <FilterButton buttonText="Superiori"/>
                    <FilterButton buttonText="Università"/>
                    <FilterButton buttonText="Altro"/>
                </div>
                
                <button type="submit">Applica Filtri</button>
            </form>
        </div>
    );
}

export function BlockNotesDiv({title, author, price, imgURL}) {
    return (
        <div className="blocknotes">
            <img src={imgURL} alt="" />

            <div className="blocknotes-data">
                <p className="blocknotes-title">{title}</p>

                <div>
                    <p className="author-name">{author}</p>

                    <div className="price">
                        <img src="./images/TokenoteIcon.png" alt="Tokenotes" />
                        <p>{price}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ResultsDiv({data}) {
    
    return (
        <div className="data">
            <BlockNotesDiv title="TEST1" author="authorTest" price={1} imgURL={null}/>
            <BlockNotesDiv title="TEST2" author="authorTest" price={2} imgURL={null}/>

            {
                data && data.length > 0 && data.map((blocknote) => {
                    return <BlockNotesDiv title={blocknote.title} author={blocknote.author} price={blocknote.price} imgURL={blocknote.imgURL}/>
                })
            }
        </div>
    );
}

export default function SearchDiv() {
    const [data, setData] = useState(null);

    return (
        <div className="search-div">
            <FilterDiv/>
            <ResultsDiv data={data}/>
        </div>
    );
}
