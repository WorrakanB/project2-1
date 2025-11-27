import './searchbar.css';

const filters = ['All jobs', 'New', 'In progress', 'Completed', 'Canceled'];

const searchbar = () => {
  return (
    <header className="app-header">
      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Search job, client, or tag"
          className="search-input"
        />
        <button className="sort-btn">sort</button>
        <button className="search-filter-btn">Filters</button>
      </div>

      <div className="header-actions">
        <div className="header-tabs">
          {filters.map((filter) => (
            <button
              key={filter}
              className={`header-tab ${filter === 'All jobs' ? 'active' : ''}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default searchbar ;
