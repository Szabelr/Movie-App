import React from 'react'

const search = ({ searchTerm, setSearchTerm, placeholder = 'Search for movies' }) => {
  return (
    <div className='search'>
        <div>
            <img src="./search.svg" alt="Search Icon"/>
            <input 
              type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
            />
        </div>
    </div>
  )
}

export default search